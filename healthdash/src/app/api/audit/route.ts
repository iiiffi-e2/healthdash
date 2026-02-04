import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";

const querySchema = z.object({
  entityType: z.string().optional(),
  page: z.coerce.number().optional().default(1),
});

export async function GET(request: Request) {
  const { error } = await requireApiUser(Permissions.VIEW_AUDIT);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    entityType: searchParams.get("entityType") ?? undefined,
    page: searchParams.get("page") ?? "1",
  });
  if (!parsed.success) {
    return apiError("INVALID_QUERY", "Invalid query parameters.", 400, parsed.error);
  }

  const pageSize = 30;
  const skip = (parsed.data.page - 1) * pageSize;

  const logs = await prisma.auditLog.findMany({
    where: { entityType: parsed.data.entityType },
    include: { actorUser: true },
    orderBy: { createdAt: "desc" },
    take: pageSize,
    skip,
  });

  return apiOk(
    logs.map((log) => ({
      id: log.id,
      actor: log.actorUser?.name ?? "System",
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      createdAt: log.createdAt.toLocaleString(),
    })),
  );
}
