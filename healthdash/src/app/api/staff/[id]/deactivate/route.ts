import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { error, user } = await requireApiUser(Permissions.MANAGE_STAFF);
  if (error) return error;

  const staff = await prisma.user.findUnique({ where: { id: params.id } });
  if (!staff) {
    return apiError("NOT_FOUND", "Staff member not found.", 404);
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: { isActive: false },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "UPDATE",
      entityType: "User",
      entityId: updated.id,
      beforeJson: staff,
      afterJson: updated,
    },
  });

  return apiOk(updated);
}
