import { prisma } from "@/lib/prisma";
import { apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";

export async function GET() {
  const { error } = await requireApiUser(Permissions.MANAGE_SCHEDULES);
  if (error) return error;

  const locations = await prisma.location.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return apiOk(
    locations.map((location) => ({
      id: location.id,
      name: location.name,
      timezone: location.timezone,
    })),
  );
}
