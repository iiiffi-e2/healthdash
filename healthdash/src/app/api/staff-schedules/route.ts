import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";

const querySchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
  userId: z.string().optional(),
});

const scheduleSchema = z.object({
  userId: z.string(),
  startAt: z.string(),
  endAt: z.string(),
  type: z.string(),
  locationId: z.string().optional(),
  note: z.string().optional(),
});

export async function GET(request: Request) {
  const { error } = await requireApiUser(Permissions.MANAGE_STAFF);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    start: searchParams.get("start") ?? undefined,
    end: searchParams.get("end") ?? undefined,
    userId: searchParams.get("userId") ?? undefined,
  });
  if (!parsed.success) {
    return apiError("INVALID_QUERY", "Invalid query parameters.", 400, parsed.error);
  }

  const schedules = await prisma.staffSchedule.findMany({
    where: {
      userId: parsed.data.userId,
      startAt: parsed.data.start ? { gte: new Date(parsed.data.start) } : undefined,
      endAt: parsed.data.end ? { lte: new Date(parsed.data.end) } : undefined,
    },
    include: { user: true, location: true },
    orderBy: { startAt: "asc" },
  });

  return apiOk(
    schedules.map((schedule) => ({
      id: schedule.id,
      userId: schedule.userId,
      userName: schedule.user.name,
      startAt: schedule.startAt.toISOString(),
      endAt: schedule.endAt.toISOString(),
      type: schedule.type,
      location: schedule.location?.name,
      note: schedule.note,
    })),
  );
}

export async function POST(request: Request) {
  const { error } = await requireApiUser(Permissions.MANAGE_STAFF);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = scheduleSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Invalid schedule payload.", 400, parsed.error);
  }

  const schedule = await prisma.staffSchedule.create({
    data: {
      userId: parsed.data.userId,
      startAt: new Date(parsed.data.startAt),
      endAt: new Date(parsed.data.endAt),
      type: parsed.data.type as never,
      locationId: parsed.data.locationId,
      note: parsed.data.note,
    },
  });

  return apiOk(schedule);
}
