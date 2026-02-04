import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";
import { emitRealtime } from "@/lib/realtime";

const updateSchema = z.object({
  payerName: z.string().optional(),
  amountBilledCents: z.number().int().optional(),
  amountPaidCents: z.number().int().optional(),
  status: z.string().optional(),
  submittedAt: z.string().optional(),
  decidedAt: z.string().optional(),
  flagged: z.boolean().optional(),
  denialReason: z.string().optional().nullable(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireApiUser(Permissions.MANAGE_CLAIMS);
  if (error) return error;

  const { id } = await params;
  const claim = await prisma.claim.findUnique({
    where: { id },
    include: { patient: true, statusHistory: { orderBy: { changedAt: "desc" } } },
  });
  if (!claim) {
    return apiError("NOT_FOUND", "Claim not found.", 404);
  }

  return apiOk({
    id: claim.id,
    patient: `${claim.patient.firstName} ${claim.patient.lastName}`,
    payerName: claim.payerName,
    amountBilledCents: claim.amountBilledCents,
    amountPaidCents: claim.amountPaidCents,
    status: claim.status,
    flagged: claim.flagged,
    denialReason: claim.denialReason,
    timeline: claim.statusHistory.map((history) => ({
      id: history.id,
      title: `${history.fromStatus} → ${history.toStatus}`,
      timestamp: history.changedAt.toLocaleString(),
      description: history.note ?? undefined,
    })),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error, user } = await requireApiUser(Permissions.MANAGE_CLAIMS);
  if (error) return error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Invalid claim payload.", 400, parsed.error);
  }

  const existing = await prisma.claim.findUnique({
    where: { id },
  });
  if (!existing) {
    return apiError("NOT_FOUND", "Claim not found.", 404);
  }

  const updated = await prisma.claim.update({
    where: { id },
    data: {
      payerName: parsed.data.payerName,
      amountBilledCents: parsed.data.amountBilledCents,
      amountPaidCents: parsed.data.amountPaidCents,
      status: parsed.data.status as never,
      submittedAt: parsed.data.submittedAt ? new Date(parsed.data.submittedAt) : undefined,
      decidedAt: parsed.data.decidedAt ? new Date(parsed.data.decidedAt) : undefined,
      flagged: parsed.data.flagged,
      denialReason: parsed.data.denialReason ?? undefined,
      updatedByUserId: user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "UPDATE",
      entityType: "Claim",
      entityId: updated.id,
      beforeJson: existing,
      afterJson: updated,
    },
  });

  emitRealtime("practice:default", "claims.updated", {
    id: updated.id,
    action: "updated",
  });

  return apiOk(updated);
}
