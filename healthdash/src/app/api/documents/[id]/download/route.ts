import { readFile } from "fs/promises";
import { prisma } from "@/lib/prisma";
import { apiError, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";
import { storageProvider } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { error } = await requireApiUser(Permissions.MANAGE_DOCUMENTS);
  if (error) return error;

  const document = await prisma.document.findUnique({
    where: { id: params.id },
  });
  if (!document) {
    return apiError("NOT_FOUND", "Document not found.", 404);
  }

  const filePath = storageProvider.getDownloadPath(document.storageKey);
  const fileBuffer = await readFile(filePath);

  return new Response(fileBuffer, {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Disposition": `attachment; filename="${document.title}"`,
    },
  });
}
