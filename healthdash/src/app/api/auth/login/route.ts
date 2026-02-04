import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk } from "@/lib/api";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Invalid login payload.", 400, parsed.error);
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return apiError("INVALID_CREDENTIALS", "Invalid email or password.", 401);
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) {
    return apiError("INVALID_CREDENTIALS", "Invalid email or password.", 401);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "LOGIN",
      entityType: "User",
      entityId: user.id,
      ip: request.headers.get("x-forwarded-for") ?? undefined,
    },
  });

  return apiOk({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
}
