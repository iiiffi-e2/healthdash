import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";

const updateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  role: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { error, user } = await requireApiUser(Permissions.MANAGE_STAFF);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Invalid staff payload.", 400, parsed.error);
  }

  const existing = await prisma.user.findUnique({ where: { id: params.id } });
  if (!existing) {
    return apiError("NOT_FOUND", "Staff member not found.", 404);
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: {
      name: parsed.data.name,
      email: parsed.data.email?.toLowerCase(),
      role: parsed.data.role as never,
      isActive: parsed.data.isActive,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "UPDATE",
      entityType: "User",
      entityId: updated.id,
      beforeJson: existing,
      afterJson: updated,
    },
  });

  return apiOk(updated);
}
