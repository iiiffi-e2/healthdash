import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";
import { calculateEndAt, checkAppointmentConflicts } from "@/lib/appointments";
import { emitRealtime } from "@/lib/realtime";

const updateSchema = z.object({
  providerId: z.string().optional(),
  locationId: z.string().optional(),
  appointmentTypeId: z.string().optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional().nullable(),
  status: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { error } = await requireApiUser(Permissions.MANAGE_APPOINTMENTS);
  if (error) return error;

  const appointment = await prisma.appointment.findUnique({
    where: { id: params.id },
    include: {
      patient: true,
      provider: true,
      location: true,
    },
  });
  if (!appointment) {
    return apiError("NOT_FOUND", "Appointment not found.", 404);
  }

  return apiOk({
    id: appointment.id,
    patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
    providerName: appointment.provider.name,
    locationName: appointment.location.name,
    startAt: appointment.startAt.toLocaleString(),
    endAt: appointment.endAt.toLocaleString(),
    status: appointment.status,
    reason: appointment.reason,
    notes: appointment.notes,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { error, user } = await requireApiUser(Permissions.MANAGE_APPOINTMENTS);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Invalid appointment payload.", 400, parsed.error);
  }

  const existing = await prisma.appointment.findUnique({
    where: { id: params.id },
  });
  if (!existing) {
    return apiError("NOT_FOUND", "Appointment not found.", 404);
  }

  const startAt = parsed.data.startAt
    ? new Date(parsed.data.startAt)
    : existing.startAt;
  const endAt = await calculateEndAt(
    parsed.data.appointmentTypeId ?? existing.appointmentTypeId,
    startAt,
    parsed.data.endAt
      ? new Date(parsed.data.endAt)
      : parsed.data.appointmentTypeId
        ? undefined
        : existing.endAt,
  );

  if (
    parsed.data.providerId ||
    parsed.data.locationId ||
    parsed.data.startAt ||
    parsed.data.endAt
  ) {
    const conflicts = await checkAppointmentConflicts({
      providerId: parsed.data.providerId ?? existing.providerId,
      locationId: parsed.data.locationId ?? existing.locationId,
      startAt,
      endAt,
      excludeAppointmentId: existing.id,
    });

    if ((conflicts.providerConflict || conflicts.locationConflict) && user) {
      if (!user.permissions.includes(Permissions.APPOINTMENT_OVERRIDE)) {
        return apiError(
          "CONFLICT",
          "This time slot is already booked. Please choose another slot or request an override.",
          409,
        );
      }
    }
  }

  const updated = await prisma.appointment.update({
    where: { id: params.id },
    data: {
      providerId: parsed.data.providerId,
      locationId: parsed.data.locationId,
      appointmentTypeId: parsed.data.appointmentTypeId,
      startAt,
      endAt,
      status: parsed.data.status,
      reason: parsed.data.reason,
      notes: parsed.data.notes,
      updatedByUserId: user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "UPDATE",
      entityType: "Appointment",
      entityId: updated.id,
      beforeJson: existing,
      afterJson: updated,
    },
  });

  emitRealtime("practice:default", "appointments.updated", {
    id: updated.id,
    action: "updated",
  });

  return apiOk(updated);
}
