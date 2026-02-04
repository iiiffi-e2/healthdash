import { prisma } from "@/lib/prisma";
import { apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";

export async function GET() {
  const { error } = await requireApiUser(Permissions.MANAGE_SCHEDULES);
  if (error) return error;

  const providers = await prisma.user.findMany({
    where: { role: "PHYSICIAN", isActive: true },
    include: { providerProfile: true },
  });

  return apiOk(
    providers.map((provider) => ({
      id: provider.id,
      name: provider.name,
      color: provider.providerProfile?.color ?? "#0ea5a0",
      specialty: provider.providerProfile?.specialty ?? "Provider",
    })),
  );
}
