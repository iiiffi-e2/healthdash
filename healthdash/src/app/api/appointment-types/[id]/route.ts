import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";

const updateSchema = z.object({
  name: z.string().optional(),
  defaultDurationMin: z.number().int().min(5).optional(),
  color: z.string().optional(),
  bufferBeforeMin: z.number().int().optional(),
  bufferAfterMin: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { error, user } = await requireApiUser(Permissions.MANAGE_SCHEDULES);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Invalid appointment type payload.", 400, parsed.error);
  }

  const existing = await prisma.appointmentType.findUnique({
    where: { id: params.id },
  });
  if (!existing) {
    return apiError("NOT_FOUND", "Appointment type not found.", 404);
  }

  const updated = await prisma.appointmentType.update({
    where: { id: params.id },
    data: parsed.data,
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "UPDATE",
      entityType: "AppointmentType",
      entityId: updated.id,
      beforeJson: existing,
      afterJson: updated,
    },
  });

  return apiOk(updated);
}
