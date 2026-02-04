import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";
import { calculateEndAt } from "@/lib/appointments";
import { emitRealtime } from "@/lib/realtime";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { error, user } = await requireApiUser(Permissions.MANAGE_APPOINTMENTS);
  if (error) return error;

  const waitlist = await prisma.waitlistRequest.findUnique({
    where: { id: params.id },
  });
  if (!waitlist) {
    return apiError("NOT_FOUND", "Waitlist request not found.", 404);
  }

  if (!waitlist.preferredStartAt || !waitlist.appointmentTypeId) {
    return apiError(
      "INVALID_REQUEST",
      "Waitlist request is missing preferred time or appointment type.",
      400,
    );
  }

  const provider = await prisma.user.findFirst({
    where: { role: "PHYSICIAN", isActive: true },
  });
  const location = await prisma.location.findFirst({
    where: { isActive: true },
  });

  if (!provider || !location) {
    return apiError("NO_RESOURCES", "No provider or location available.", 409);
  }

  const endAt = await calculateEndAt(
    waitlist.appointmentTypeId,
    waitlist.preferredStartAt,
    waitlist.preferredEndAt,
  );

  const appointment = await prisma.appointment.create({
    data: {
      patientId: waitlist.patientId,
      providerId: provider.id,
      locationId: location.id,
      appointmentTypeId: waitlist.appointmentTypeId,
      startAt: waitlist.preferredStartAt,
      endAt,
      status: "SCHEDULED",
      createdByUserId: user.id,
    },
  });

  const updated = await prisma.waitlistRequest.update({
    where: { id: waitlist.id },
    data: { status: "BOOKED" },
  });

  emitRealtime("practice:default", "appointments.updated", {
    id: appointment.id,
    action: "created",
  });

  return apiOk({ appointment, waitlist: updated });
}
