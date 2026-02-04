import { z } from "zod";
import { subDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";

const querySchema = z.object({
  windowDays: z.coerce.number().optional().default(90),
});

export async function GET(request: Request) {
  const { error } = await requireApiUser(Permissions.VIEW_REPORTS);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    windowDays: searchParams.get("windowDays") ?? "90",
  });
  if (!parsed.success) {
    return apiError("INVALID_QUERY", "Invalid query parameters.", 400, parsed.error);
  }

  const since = subDays(new Date(), parsed.data.windowDays);
  const [pending, pendingSum, approved, denied, flagged] = await Promise.all([
    prisma.claim.count({ where: { status: "PENDING" } }),
    prisma.claim.aggregate({
      where: { status: "PENDING" },
      _sum: { amountBilledCents: true, amountPaidCents: true },
    }),
    prisma.claim.count({
      where: { status: "APPROVED", decidedAt: { gte: since } },
    }),
    prisma.claim.count({
      where: { status: "DENIED", decidedAt: { gte: since } },
    }),
    prisma.claim.findMany({
      where: { flagged: true },
      include: { patient: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const pendingAmount =
    (pendingSum._sum.amountBilledCents ?? 0) -
    (pendingSum._sum.amountPaidCents ?? 0);
  const approvalRate = approved + denied === 0 ? 0 : approved / (approved + denied);

  return apiOk({
    pendingCount: pending,
    pendingAmountCents: pendingAmount,
    approvedCount: approved,
    deniedCount: denied,
    approvalRate,
    flagged: flagged.map((claim) => ({
      id: claim.id,
      patient: `${claim.patient.firstName} ${claim.patient.lastName}`,
      amount: claim.amountBilledCents,
    })),
  });
}
