import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";
import { emitRealtime } from "@/lib/realtime";

const statusSchema = z.object({
  status: z.string(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { error, user } = await requireApiUser(Permissions.MANAGE_APPOINTMENTS);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Invalid status payload.", 400, parsed.error);
  }

  const existing = await prisma.appointment.findUnique({
    where: { id: params.id },
  });
  if (!existing) {
    return apiError("NOT_FOUND", "Appointment not found.", 404);
  }

  const updated = await prisma.appointment.update({
    where: { id: params.id },
    data: {
      status: parsed.data.status as never,
      updatedByUserId: user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "STATUS_CHANGE",
      entityType: "Appointment",
      entityId: updated.id,
      beforeJson: { status: existing.status },
      afterJson: { status: updated.status },
    },
  });

  emitRealtime("practice:default", "appointments.updated", {
    id: updated.id,
    action: "status",
    status: updated.status,
  });

  return apiOk(updated);
}
