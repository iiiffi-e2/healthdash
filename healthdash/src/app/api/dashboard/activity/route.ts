import { prisma } from "@/lib/prisma";
import { apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";

export async function GET() {
  const { error } = await requireApiUser(Permissions.VIEW_DASHBOARD);
  if (error) return error;

  const [audits, claimHistory] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { actorUser: true },
    }),
    prisma.claimStatusHistory.findMany({
      orderBy: { changedAt: "desc" },
      take: 10,
      include: { claim: { include: { patient: true } } },
    }),
  ]);

  const auditItems = audits.map((log) => ({
    id: log.id,
    title: `${log.actorUser?.name ?? "System"} ${log.action.toLowerCase()}`,
    description: `${log.entityType} ${log.entityId}`,
    timestamp: log.createdAt,
    tag: log.action,
  }));

  const claimItems = claimHistory.map((history) => ({
    id: history.id,
    title: `Claim ${history.toStatus.toLowerCase()}`,
    description: `${history.claim.patient.firstName} ${history.claim.patient.lastName}`,
    timestamp: history.changedAt,
    tag: "CLAIM",
  }));

  const combined = [...auditItems, ...claimItems]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 20)
    .map((item) => ({
      ...item,
      timestamp: item.timestamp.toLocaleString(),
    }));

  return apiOk(combined);
}
