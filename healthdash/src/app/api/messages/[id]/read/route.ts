import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { error } = await requireApiUser(Permissions.MANAGE_MESSAGES);
  if (error) return error;

  const message = await prisma.message.findUnique({
    where: { id: params.id },
  });
  if (!message) {
    return apiError("NOT_FOUND", "Message not found.", 404);
  }

  const updated = await prisma.message.update({
    where: { id: params.id },
    data: { readAt: new Date() },
  });

  return apiOk(updated);
}
