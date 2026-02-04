import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { error, user } = await requireApiUser(Permissions.MANAGE_BILLING);
  if (error) return error;

  const invoice = await prisma.invoice.findUnique({ where: { id: params.id } });
  if (!invoice) {
    return apiError("NOT_FOUND", "Invoice not found.", 404);
  }

  const updated = await prisma.invoice.update({
    where: { id: params.id },
    data: { status: "VOID", balanceCents: 0 },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "STATUS_CHANGE",
      entityType: "Invoice",
      entityId: updated.id,
      beforeJson: { status: invoice.status },
      afterJson: { status: updated.status },
    },
  });

  return apiOk(updated);
}
