import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";
import { emitRealtime } from "@/lib/realtime";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { error, user } = await requireApiUser(Permissions.MANAGE_CLAIMS);
  if (error) return error;

  const claim = await prisma.claim.findUnique({ where: { id: params.id } });
  if (!claim) {
    return apiError("NOT_FOUND", "Claim not found.", 404);
  }

  const updated = await prisma.claim.update({
    where: { id: params.id },
    data: { flagged: false, updatedByUserId: user.id },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "UPDATE",
      entityType: "Claim",
      entityId: updated.id,
      beforeJson: { flagged: claim.flagged },
      afterJson: { flagged: updated.flagged },
    },
  });

  emitRealtime("practice:default", "claims.updated", {
    id: updated.id,
    action: "unflagged",
  });

  return apiOk(updated);
}
