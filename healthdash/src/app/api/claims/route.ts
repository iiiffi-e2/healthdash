import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";
import { emitRealtime } from "@/lib/realtime";

const querySchema = z.object({
  status: z.string().optional(),
  flagged: z.string().optional(),
  query: z.string().optional(),
  page: z.coerce.number().optional().default(1),
});

const claimSchema = z.object({
  patientId: z.string(),
  appointmentId: z.string().optional(),
  encounterId: z.string().optional(),
  payerName: z.string(),
  amountBilledCents: z.number().int(),
  amountPaidCents: z.number().int().optional(),
  status: z.string().optional(),
  submittedAt: z.string().optional(),
  decidedAt: z.string().optional(),
  denialReason: z.string().optional(),
});

export async function GET(request: Request) {
  const { error } = await requireApiUser(Permissions.MANAGE_CLAIMS);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    status: searchParams.get("status") ?? undefined,
    flagged: searchParams.get("flagged") ?? undefined,
    query: searchParams.get("query") ?? undefined,
    page: searchParams.get("page") ?? "1",
  });
  if (!parsed.success) {
    return apiError("INVALID_QUERY", "Invalid query parameters.", 400, parsed.error);
  }

  const pageSize = 20;
  const skip = (parsed.data.page - 1) * pageSize;
  const query = parsed.data.query?.trim();

  const claims = await prisma.claim.findMany({
    where: {
      status: parsed.data.status ? (parsed.data.status as never) : undefined,
      flagged:
        parsed.data.flagged === "true"
          ? true
          : parsed.data.flagged === "false"
            ? false
            : undefined,
      OR: query
        ? [
            { payerName: { contains: query, mode: "insensitive" } },
            { patient: { firstName: { contains: query, mode: "insensitive" } } },
            { patient: { lastName: { contains: query, mode: "insensitive" } } },
          ]
        : undefined,
    },
    include: { patient: true },
    orderBy: { updatedAt: "desc" },
    take: pageSize,
    skip,
  });

  return apiOk(
    claims.map((claim) => ({
      id: claim.id,
      patient: `${claim.patient.firstName} ${claim.patient.lastName}`,
      payerName: claim.payerName,
      amountBilledCents: claim.amountBilledCents,
      status: claim.status,
      flagged: claim.flagged,
    })),
  );
}

export async function POST(request: Request) {
  const { error, user } = await requireApiUser(Permissions.MANAGE_CLAIMS);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = claimSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Invalid claim payload.", 400, parsed.error);
  }

  const claim = await prisma.claim.create({
    data: {
      patientId: parsed.data.patientId,
      appointmentId: parsed.data.appointmentId,
      encounterId: parsed.data.encounterId,
      payerName: parsed.data.payerName,
      amountBilledCents: parsed.data.amountBilledCents,
      amountPaidCents: parsed.data.amountPaidCents ?? 0,
      status: (parsed.data.status ?? "DRAFT") as never,
      submittedAt: parsed.data.submittedAt ? new Date(parsed.data.submittedAt) : undefined,
      decidedAt: parsed.data.decidedAt ? new Date(parsed.data.decidedAt) : undefined,
      denialReason: parsed.data.denialReason,
      createdByUserId: user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "CREATE",
      entityType: "Claim",
      entityId: claim.id,
      afterJson: claim,
    },
  });

  emitRealtime("practice:default", "claims.updated", {
    id: claim.id,
    action: "created",
  });

  return apiOk(claim);
}
