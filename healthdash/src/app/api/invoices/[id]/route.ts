import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";

const updateSchema = z.object({
  totalAmountCents: z.number().int().optional(),
  balanceCents: z.number().int().optional(),
  status: z.string().optional(),
  dueAt: z.string().optional().nullable(),
});

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { error } = await requireApiUser(Permissions.MANAGE_BILLING);
  if (error) return error;

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { patient: true, payments: true },
  });
  if (!invoice) {
    return apiError("NOT_FOUND", "Invoice not found.", 404);
  }

  return apiOk(invoice);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { error, user } = await requireApiUser(Permissions.MANAGE_BILLING);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Invalid invoice payload.", 400, parsed.error);
  }

  const existing = await prisma.invoice.findUnique({
    where: { id: params.id },
  });
  if (!existing) {
    return apiError("NOT_FOUND", "Invoice not found.", 404);
  }

  const updated = await prisma.invoice.update({
    where: { id: params.id },
    data: {
      totalAmountCents: parsed.data.totalAmountCents,
      balanceCents: parsed.data.balanceCents,
      status: parsed.data.status as never,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "UPDATE",
      entityType: "Invoice",
      entityId: updated.id,
      beforeJson: existing,
      afterJson: updated,
    },
  });

  return apiOk(updated);
}
