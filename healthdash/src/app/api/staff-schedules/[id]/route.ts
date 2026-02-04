import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";

const updateSchema = z.object({
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  type: z.string().optional(),
  locationId: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { error } = await requireApiUser(Permissions.MANAGE_STAFF);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Invalid schedule payload.", 400, parsed.error);
  }

  const existing = await prisma.staffSchedule.findUnique({
    where: { id: params.id },
  });
  if (!existing) {
    return apiError("NOT_FOUND", "Schedule not found.", 404);
  }

  const updated = await prisma.staffSchedule.update({
    where: { id: params.id },
    data: {
      startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : undefined,
      endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : undefined,
      type: parsed.data.type as never,
      locationId: parsed.data.locationId ?? undefined,
      note: parsed.data.note ?? undefined,
    },
  });

  return apiOk(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { error } = await requireApiUser(Permissions.MANAGE_STAFF);
  if (error) return error;

  const existing = await prisma.staffSchedule.findUnique({
    where: { id: params.id },
  });
  if (!existing) {
    return apiError("NOT_FOUND", "Schedule not found.", 404);
  }

  await prisma.staffSchedule.delete({ where: { id: params.id } });
  return apiOk({ id: params.id });
}
