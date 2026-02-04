import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";

const messageSchema = z.object({
  senderType: z.enum(["PATIENT", "STAFF"]),
  senderPatientId: z.string().optional(),
  body: z.string().min(1),
});

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { error } = await requireApiUser(Permissions.MANAGE_MESSAGES);
  if (error) return error;

  const messages = await prisma.message.findMany({
    where: { threadId: params.id },
    orderBy: { createdAt: "asc" },
  });

  return apiOk(messages);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { error, user } = await requireApiUser(Permissions.MANAGE_MESSAGES);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Invalid message payload.", 400, parsed.error);
  }

  const thread = await prisma.messageThread.findUnique({
    where: { id: params.id },
  });
  if (!thread) {
    return apiError("NOT_FOUND", "Thread not found.", 404);
  }

  const message = await prisma.message.create({
    data: {
      threadId: params.id,
      senderType: parsed.data.senderType,
      senderPatientId: parsed.data.senderType === "PATIENT" ? parsed.data.senderPatientId : undefined,
      senderUserId: parsed.data.senderType === "STAFF" ? user.id : undefined,
      body: parsed.data.body,
    },
  });

  await prisma.messageThread.update({
    where: { id: params.id },
    data: { lastMessageAt: new Date() },
  });

  return apiOk(message);
}
