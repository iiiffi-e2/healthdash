import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";

const updateSchema = z.object({
  status: z.string().optional(),
  note: z.string().optional(),
  priority: z.number().int().min(1).max(5).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { error } = await requireApiUser(Permissions.MANAGE_APPOINTMENTS);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Invalid waitlist payload.", 400, parsed.error);
  }

  const existing = await prisma.waitlistRequest.findUnique({
    where: { id: params.id },
  });
  if (!existing) {
    return apiError("NOT_FOUND", "Waitlist request not found.", 404);
  }

  const updated = await prisma.waitlistRequest.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return apiOk(updated);
}
