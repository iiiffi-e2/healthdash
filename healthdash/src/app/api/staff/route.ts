import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";

const staffSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.string(),
  password: z.string().min(8),
});

export async function GET() {
  const { error } = await requireApiUser(Permissions.MANAGE_STAFF);
  if (error) return error;

  const staff = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return apiOk(
    staff.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    })),
  );
}

export async function POST(request: Request) {
  const { error, user } = await requireApiUser(Permissions.MANAGE_STAFF);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = staffSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Invalid staff payload.", 400, parsed.error);
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const staffMember = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role as never,
      passwordHash,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "CREATE",
      entityType: "User",
      entityId: staffMember.id,
      afterJson: staffMember,
    },
  });

  return apiOk(staffMember);
}
