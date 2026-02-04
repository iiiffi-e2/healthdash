import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";
import { emitRealtime } from "@/lib/realtime";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { error, user } = await requireApiUser(Permissions.MANAGE_APPOINTMENTS);
  if (error) return error;

  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
  });
  if (!appointment) {
    return apiError("NOT_FOUND", "Appointment not found.", 404);
  }

  const updated = await prisma.appointment.update({
    where: { id: params.id },
    data: {
      status: "CANCELED",
      updatedByUserId: user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "STATUS_CHANGE",
      entityType: "Appointment",
      entityId: updated.id,
      beforeJson: { status: appointment.status },
      afterJson: { status: updated.status },
    },
  });

  emitRealtime("practice:default", "appointments.updated", {
    id: updated.id,
    action: "canceled",
  });

  return apiOk(updated);
}
