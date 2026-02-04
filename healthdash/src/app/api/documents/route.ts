import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";

const documentSchema = z.object({
  patientId: z.string(),
  title: z.string(),
  type: z.string(),
  storageKey: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
});

export async function POST(request: Request) {
  const { error, user } = await requireApiUser(Permissions.MANAGE_DOCUMENTS);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = documentSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Invalid document payload.", 400, parsed.error);
  }

  const document = await prisma.document.create({
    data: {
      patientId: parsed.data.patientId,
      title: parsed.data.title,
      type: parsed.data.type,
      storageKey: parsed.data.storageKey,
      mimeType: parsed.data.mimeType,
      sizeBytes: parsed.data.sizeBytes,
      uploadedByUserId: user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "CREATE",
      entityType: "Document",
      entityId: document.id,
      afterJson: document,
    },
  });

  return apiOk(document);
}
