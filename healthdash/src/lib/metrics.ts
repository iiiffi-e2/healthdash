import { subDays, subMonths, startOfDay, endOfDay, startOfMonth } from "date-fns";
import { prisma } from "@/lib/prisma";

const pendingStatuses = ["PENDING", "SUBMITTED", "RESUBMITTED", "APPEALED"] as const;

export async function getDashboardMetrics() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const activeSince = subMonths(now, 18);
  const retentionSince = subMonths(now, 12);
  const noShowSince = subDays(now, 30);

  const [
    appointmentsToday,
    appointmentsCompletedToday,
    pendingClaims,
    pendingClaimsSum,
    monthlyPayments,
    activePatients,
    completedAppointmentsThisMonth,
    noShowCount,
    totalAppointments30Days,
    completedAppointmentsRetention,
    totalPatients,
  ] = await Promise.all([
    prisma.appointment.count({
      where: { startAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.appointment.count({
      where: {
        startAt: { gte: todayStart, lte: todayEnd },
        status: "COMPLETED",
      },
    }),
    prisma.claim.count({
      where: { status: { in: pendingStatuses } },
    }),
    prisma.claim.aggregate({
      where: { status: { in: pendingStatuses } },
      _sum: { amountBilledCents: true, amountPaidCents: true },
    }),
    prisma.payment.aggregate({
      where: { postedAt: { gte: monthStart, lt: monthEnd } },
      _sum: { amountCents: true },
    }),
    prisma.appointment.count({
      where: { startAt: { gte: activeSince } },
      distinct: ["patientId"],
    }),
    prisma.appointment.count({
      where: {
        status: "COMPLETED",
        startAt: { gte: monthStart, lt: monthEnd },
      },
    }),
    prisma.appointment.count({
      where: {
        status: "NO_SHOW",
        startAt: { gte: noShowSince },
      },
    }),
    prisma.appointment.count({
      where: {
        startAt: { gte: noShowSince },
      },
    }),
    prisma.appointment.groupBy({
      by: ["patientId"],
      where: {
        status: "COMPLETED",
        startAt: { gte: retentionSince },
      },
      _count: { patientId: true },
    }),
    prisma.patient.count({ where: { isActive: true } }),
  ]);

  const retentionPatients = completedAppointmentsRetention.filter(
    (row) => row._count.patientId >= 2,
  ).length;
  const retentionRate = totalPatients === 0 ? 0 : retentionPatients / totalPatients;

  const pendingSum =
    (pendingClaimsSum._sum.amountBilledCents ?? 0) -
    (pendingClaimsSum._sum.amountPaidCents ?? 0);
  const monthlyRevenue = monthlyPayments._sum.amountCents ?? 0;

  const avgVisitValue =
    completedAppointmentsThisMonth === 0
      ? 0
      : Math.round(monthlyRevenue / completedAppointmentsThisMonth);

  const noShowRate =
    totalAppointments30Days === 0 ? 0 : noShowCount / totalAppointments30Days;

  const lostRevenueRisk = await getLostRevenueRisk(now);
  const revenueSeries = await getMonthlyRevenueSeries(now);

  return {
    appointmentsToday,
    appointmentsCompletedToday,
    pendingClaims,
    pendingClaimsAmountCents: pendingSum,
    monthlyRevenueCents: monthlyRevenue,
    activePatients,
    patientRetentionRate: retentionRate,
    noShowRate,
    avgVisitValueCents: avgVisitValue,
    lostRevenueRiskCents: lostRevenueRisk,
    revenueSeries,
  };
}

async function getLostRevenueRisk(now: Date) {
  const pendingRiskSince = subDays(now, 30);
  const deniedRiskSince = subDays(now, 14);

  const [pendingRisk, deniedRisk] = await Promise.all([
    prisma.claim.aggregate({
      where: {
        status: "PENDING",
        submittedAt: { lt: pendingRiskSince },
      },
      _sum: { amountBilledCents: true, amountPaidCents: true },
    }),
    prisma.claim.aggregate({
      where: {
        status: "DENIED",
        decidedAt: { lt: deniedRiskSince },
      },
      _sum: { amountBilledCents: true, amountPaidCents: true },
    }),
  ]);

  const pending =
    (pendingRisk._sum.amountBilledCents ?? 0) -
    (pendingRisk._sum.amountPaidCents ?? 0);
  const denied =
    (deniedRisk._sum.amountBilledCents ?? 0) -
    (deniedRisk._sum.amountPaidCents ?? 0);

  return pending + denied;
}

async function getMonthlyRevenueSeries(now: Date) {
  const start = startOfMonth(subMonths(now, 5));
  const payments = await prisma.payment.findMany({
    where: { postedAt: { gte: start, lte: now } },
    select: { postedAt: true, amountCents: true },
  });

  const series: Record<string, number> = {};
  for (let i = 5; i >= 0; i -= 1) {
    const date = subMonths(startOfMonth(now), i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    series[key] = 0;
  }

  payments.forEach((payment) => {
    const key = `${payment.postedAt.getFullYear()}-${String(
      payment.postedAt.getMonth() + 1,
    ).padStart(2, "0")}`;
    if (series[key] !== undefined) {
      series[key] += payment.amountCents;
    }
  });

  return Object.entries(series).map(([month, amountCents]) => ({
    month,
    amountCents,
  }));
}
