import { prisma } from "@/lib/prisma";

type ConflictCheck = {
  providerId: string;
  locationId?: string | null;
  startAt: Date;
  endAt: Date;
  excludeAppointmentId?: string;
};

export async function checkAppointmentConflicts({
  providerId,
  locationId,
  startAt,
  endAt,
  excludeAppointmentId,
}: ConflictCheck) {
  const providerConflict = await prisma.appointment.findFirst({
    where: {
      providerId,
      id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
    select: { id: true, startAt: true, endAt: true },
  });

  const locationConflict = locationId
    ? await prisma.appointment.findFirst({
        where: {
          locationId,
          id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
        select: { id: true, startAt: true, endAt: true },
      })
    : null;

  return { providerConflict, locationConflict };
}

export async function calculateEndAt(
  appointmentTypeId: string,
  startAt: Date,
  endAt?: Date | null,
) {
  if (endAt) {
    return endAt;
  }

  const appointmentType = await prisma.appointmentType.findUnique({
    where: { id: appointmentTypeId },
    select: { defaultDurationMin: true },
  });

  const duration = appointmentType?.defaultDurationMin ?? 30;
  const computedEndAt = new Date(startAt);
  computedEndAt.setMinutes(computedEndAt.getMinutes() + duration);
  return computedEndAt;
}
