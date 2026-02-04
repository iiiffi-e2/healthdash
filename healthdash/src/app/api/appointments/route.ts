import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";
import { calculateEndAt, checkAppointmentConflicts } from "@/lib/appointments";
import { emitRealtime } from "@/lib/realtime";

const querySchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
  providerId: z.string().optional(),
  locationId: z.string().optional(),
  patientId: z.string().optional(),
});

const appointmentSchema = z.object({
  patientId: z.string(),
  providerId: z.string(),
  locationId: z.string(),
  appointmentTypeId: z.string(),
  startAt: z.string(),
  endAt: z.string().optional(),
  status: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  const { error } = await requireApiUser(Permissions.MANAGE_APPOINTMENTS);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    start: searchParams.get("start") ?? undefined,
    end: searchParams.get("end") ?? undefined,
    providerId: searchParams.get("providerId") ?? undefined,
    locationId: searchParams.get("locationId") ?? undefined,
    patientId: searchParams.get("patientId") ?? undefined,
  });
  if (!parsed.success) {
    return apiError("INVALID_QUERY", "Invalid query parameters.", 400, parsed.error);
  }

  const start = parsed.data.start ? new Date(parsed.data.start) : undefined;
  const end = parsed.data.end ? new Date(parsed.data.end) : undefined;

  const appointments = await prisma.appointment.findMany({
    where: {
      startAt: start ? { gte: start } : undefined,
      endAt: end ? { lte: end } : undefined,
      providerId: parsed.data.providerId,
      locationId: parsed.data.locationId,
      patientId: parsed.data.patientId,
    },
    include: {
      patient: true,
      provider: true,
      location: true,
    },
    orderBy: { startAt: "asc" },
  });

  return apiOk(
    appointments.map((appointment) => ({
      id: appointment.id,
      title: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      start: appointment.startAt.toISOString(),
      end: appointment.endAt.toISOString(),
      providerId: appointment.providerId,
      status: appointment.status,
      provider: appointment.provider.name,
      location: appointment.location.name,
    })),
  );
}

export async function POST(request: Request) {
  const { error, user } = await requireApiUser(Permissions.MANAGE_APPOINTMENTS);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = appointmentSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Invalid appointment payload.", 400, parsed.error);
  }

  const startAt = new Date(parsed.data.startAt);
  const endAt = await calculateEndAt(
    parsed.data.appointmentTypeId,
    startAt,
    parsed.data.endAt ? new Date(parsed.data.endAt) : undefined,
  );

  const conflicts = await checkAppointmentConflicts({
    providerId: parsed.data.providerId,
    locationId: parsed.data.locationId,
    startAt,
    endAt,
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

  const appointment = await prisma.appointment.create({
    data: {
      patientId: parsed.data.patientId,
      providerId: parsed.data.providerId,
      locationId: parsed.data.locationId,
      appointmentTypeId: parsed.data.appointmentTypeId,
      startAt,
      endAt,
      status: parsed.data.status ?? "SCHEDULED",
      reason: parsed.data.reason,
      notes: parsed.data.notes,
      createdByUserId: user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "CREATE",
      entityType: "Appointment",
      entityId: appointment.id,
      afterJson: appointment,
    },
  });

  emitRealtime("practice:default", "appointments.updated", {
    id: appointment.id,
    action: "created",
  });

  return apiOk(appointment);
}
