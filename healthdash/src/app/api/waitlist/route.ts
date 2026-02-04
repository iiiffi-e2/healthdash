import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";

const querySchema = z.object({
  status: z.string().optional(),
});

const waitlistSchema = z.object({
  patientId: z.string(),
  appointmentTypeId: z.string().optional(),
  preferredStartAt: z.string().optional(),
  preferredEndAt: z.string().optional(),
  priority: z.number().int().min(1).max(5),
  note: z.string().optional(),
});

export async function GET(request: Request) {
  const { error } = await requireApiUser(Permissions.MANAGE_APPOINTMENTS);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    status: searchParams.get("status") ?? undefined,
  });
  if (!parsed.success) {
    return apiError("INVALID_QUERY", "Invalid query parameters.", 400, parsed.error);
  }

  const requests = await prisma.waitlistRequest.findMany({
    where: { status: parsed.data.status as never },
    include: { patient: true, appointmentType: true },
    orderBy: { createdAt: "desc" },
  });

  return apiOk(
    requests.map((requestItem) => ({
      id: requestItem.id,
      patient: `${requestItem.patient.firstName} ${requestItem.patient.lastName}`,
      appointmentType: requestItem.appointmentType?.name,
      preferredStartAt: requestItem.preferredStartAt?.toISOString() ?? null,
      preferredEndAt: requestItem.preferredEndAt?.toISOString() ?? null,
      priority: requestItem.priority,
      status: requestItem.status,
    })),
  );
}

export async function POST(request: Request) {
  const { error } = await requireApiUser(Permissions.MANAGE_APPOINTMENTS);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Invalid waitlist payload.", 400, parsed.error);
  }

  const waitlist = await prisma.waitlistRequest.create({
    data: {
      patientId: parsed.data.patientId,
      appointmentTypeId: parsed.data.appointmentTypeId,
      preferredStartAt: parsed.data.preferredStartAt
        ? new Date(parsed.data.preferredStartAt)
        : undefined,
      preferredEndAt: parsed.data.preferredEndAt
        ? new Date(parsed.data.preferredEndAt)
        : undefined,
      priority: parsed.data.priority,
      note: parsed.data.note,
    },
  });

  return apiOk(waitlist);
}
