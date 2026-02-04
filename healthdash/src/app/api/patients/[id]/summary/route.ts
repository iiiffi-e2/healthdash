import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { error } = await requireApiUser(Permissions.MANAGE_PATIENTS);
  if (error) return error;

  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
  });
  if (!patient) {
    return apiError("NOT_FOUND", "Patient not found.", 404);
  }

  const now = new Date();
  const [upcomingAppointments, openClaims, balance] = await Promise.all([
    prisma.appointment.count({
      where: {
        patientId: params.id,
        startAt: { gte: now },
        status: { notIn: ["CANCELED", "NO_SHOW"] },
      },
    }),
    prisma.claim.count({
      where: {
        patientId: params.id,
        status: { in: ["PENDING", "SUBMITTED", "RESUBMITTED", "APPEALED"] },
      },
    }),
    prisma.invoice.aggregate({
      where: { patientId: params.id },
      _sum: { balanceCents: true },
    }),
  ]);

  return apiOk({
    upcomingAppointments,
    openClaims,
    balanceCents: balance._sum.balanceCents ?? 0,
  });
}
