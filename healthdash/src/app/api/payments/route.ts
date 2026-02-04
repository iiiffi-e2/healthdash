import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";
import { emitRealtime } from "@/lib/realtime";

const querySchema = z.object({
  invoiceId: z.string().optional(),
});

const paymentSchema = z.object({
  invoiceId: z.string(),
  amountCents: z.number().int(),
  method: z.string(),
  reference: z.string().optional(),
  postedAt: z.string().optional(),
});

export async function GET(request: Request) {
  const { error } = await requireApiUser(Permissions.MANAGE_BILLING);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    invoiceId: searchParams.get("invoiceId") ?? undefined,
  });
  if (!parsed.success) {
    return apiError("INVALID_QUERY", "Invalid query parameters.", 400, parsed.error);
  }

  const payments = await prisma.payment.findMany({
    where: { invoiceId: parsed.data.invoiceId },
    orderBy: { postedAt: "desc" },
  });

  return apiOk(payments);
}

export async function POST(request: Request) {
  const { error, user } = await requireApiUser(Permissions.MANAGE_BILLING);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Invalid payment payload.", 400, parsed.error);
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: parsed.data.invoiceId },
  });
  if (!invoice) {
    return apiError("NOT_FOUND", "Invoice not found.", 404);
  }

  const payment = await prisma.payment.create({
    data: {
      invoiceId: parsed.data.invoiceId,
      amountCents: parsed.data.amountCents,
      method: parsed.data.method as never,
      reference: parsed.data.reference,
      postedAt: parsed.data.postedAt ? new Date(parsed.data.postedAt) : new Date(),
      createdByUserId: user.id,
    },
  });

  const newBalance = Math.max(invoice.balanceCents - payment.amountCents, 0);
  const status =
    newBalance === 0
      ? "PAID"
      : newBalance < invoice.totalAmountCents
        ? "PARTIALLY_PAID"
        : "OPEN";

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { balanceCents: newBalance, status },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "CREATE",
      entityType: "Payment",
      entityId: payment.id,
      afterJson: payment,
    },
  });

  emitRealtime("practice:default", "payments.created", {
    id: payment.id,
  });

  return apiOk(payment);
}
