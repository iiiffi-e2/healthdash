import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";

const querySchema = z.object({
  patientId: z.string().optional(),
  page: z.coerce.number().optional().default(1),
});

const threadSchema = z.object({
  patientId: z.string(),
  subject: z.string().min(3),
});

export async function GET(request: Request) {
  const { error } = await requireApiUser(Permissions.MANAGE_MESSAGES);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    patientId: searchParams.get("patientId") ?? undefined,
    page: searchParams.get("page") ?? "1",
  });
  if (!parsed.success) {
    return apiError("INVALID_QUERY", "Invalid query parameters.", 400, parsed.error);
  }

  const pageSize = 20;
  const skip = (parsed.data.page - 1) * pageSize;

  const threads = await prisma.messageThread.findMany({
    where: { patientId: parsed.data.patientId },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { lastMessageAt: "desc" },
    take: pageSize,
    skip,
  });

  return apiOk(
    threads.map((thread) => ({
      id: thread.id,
      subject: thread.subject,
      lastMessageAt: thread.lastMessageAt.toLocaleString(),
      lastMessagePreview: thread.messages[0]?.body ?? "No messages yet.",
    })),
  );
}

export async function POST(request: Request) {
  const { error } = await requireApiUser(Permissions.MANAGE_MESSAGES);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = threadSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Invalid thread payload.", 400, parsed.error);
  }

  const thread = await prisma.messageThread.create({
    data: {
      patientId: parsed.data.patientId,
      subject: parsed.data.subject,
      lastMessageAt: new Date(),
    },
  });

  return apiOk(thread);
}
