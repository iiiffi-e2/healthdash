import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";
import { emitRealtime } from "@/lib/realtime";

const querySchema = z.object({
  status: z.string().optional(),
  patientId: z.string().optional(),
  page: z.coerce.number().optional().default(1),
});

const invoiceSchema = z.object({
  patientId: z.string(),
  appointmentId: z.string().optional(),
  totalAmountCents: z.number().int(),
  balanceCents: z.number().int().optional(),
  status: z.string().optional(),
  dueAt: z.string().optional(),
});

export async function GET(request: Request) {
  const { error } = await requireApiUser(Permissions.MANAGE_BILLING);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    status: searchParams.get("status") ?? undefined,
    patientId: searchParams.get("patientId") ?? undefined,
    page: searchParams.get("page") ?? "1",
  });
  if (!parsed.success) {
    return apiError("INVALID_QUERY", "Invalid query parameters.", 400, parsed.error);
  }

  const pageSize = 20;
  const skip = (parsed.data.page - 1) * pageSize;

  const invoices = await prisma.invoice.findMany({
    where: {
      status: parsed.data.status ? (parsed.data.status as never) : undefined,
      patientId: parsed.data.patientId,
    },
    include: { patient: true },
    orderBy: { createdAt: "desc" },
    take: pageSize,
    skip,
  });

  return apiOk(
    invoices.map((invoice) => ({
      id: invoice.id,
      patient: `${invoice.patient.firstName} ${invoice.patient.lastName}`,
      totalAmountCents: invoice.totalAmountCents,
      balanceCents: invoice.balanceCents,
      status: invoice.status,
      createdAt: invoice.createdAt.toLocaleDateString(),
    })),
  );
}

export async function POST(request: Request) {
  const { error, user } = await requireApiUser(Permissions.MANAGE_BILLING);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = invoiceSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Invalid invoice payload.", 400, parsed.error);
  }

  const invoice = await prisma.invoice.create({
    data: {
      patientId: parsed.data.patientId,
      appointmentId: parsed.data.appointmentId,
      totalAmountCents: parsed.data.totalAmountCents,
      balanceCents: parsed.data.balanceCents ?? parsed.data.totalAmountCents,
      status: (parsed.data.status ?? "OPEN") as never,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "CREATE",
      entityType: "Invoice",
      entityId: invoice.id,
      afterJson: invoice,
    },
  });

  emitRealtime("practice:default", "payments.created", {
    id: invoice.id,
    action: "invoice_created",
  });

  return apiOk(invoice);
}
