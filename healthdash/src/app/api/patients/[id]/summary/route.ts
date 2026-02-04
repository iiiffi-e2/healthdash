import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireApiUser(Permissions.MANAGE_PATIENTS);
  if (error) return error;

  const { id } = await params;
  const patient = await prisma.patient.findUnique({
    where: { id },
  });
  if (!patient) {
    return apiError("NOT_FOUND", "Patient not found.", 404);
  }

  const now = new Date();
  const [upcomingAppointments, openClaims, balance] = await Promise.all([
    prisma.appointment.count({
      where: {
        patientId: id,
        startAt: { gte: now },
        status: { notIn: ["CANCELED", "NO_SHOW"] },
      },
    }),
    prisma.claim.count({
      where: {
        patientId: id,
        status: { in: ["PENDING", "SUBMITTED", "RESUBMITTED", "APPEALED"] },
      },
    }),
    prisma.invoice.aggregate({
      where: { patientId: id },
      _sum: { balanceCents: true },
    }),
  ]);

  return apiOk({
    upcomingAppointments,
    openClaims,
    balanceCents: balance._sum.balanceCents ?? 0,
  });
}
