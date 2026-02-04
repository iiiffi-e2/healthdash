import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";

const appointmentTypeSchema = z.object({
  name: z.string().min(1),
  defaultDurationMin: z.number().int().min(5),
  color: z.string().min(3),
  bufferBeforeMin: z.number().int().optional(),
  bufferAfterMin: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const { error } = await requireApiUser(Permissions.MANAGE_SCHEDULES);
  if (error) return error;

  const types = await prisma.appointmentType.findMany({
    orderBy: { name: "asc" },
  });

  return apiOk(types);
}

export async function POST(request: Request) {
  const { error, user } = await requireApiUser(Permissions.MANAGE_SCHEDULES);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = appointmentTypeSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Invalid appointment type payload.", 400, parsed.error);
  }

  const type = await prisma.appointmentType.create({
    data: parsed.data,
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "CREATE",
      entityType: "AppointmentType",
      entityId: type.id,
      afterJson: type,
    },
  });

  return apiOk(type);
}
