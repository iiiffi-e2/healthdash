import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const { error } = await requireApiUser(Permissions.MANAGE_DOCUMENTS);
  if (error) return error;

  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
  });
  if (!patient) {
    return apiError("NOT_FOUND", "Patient not found.", 404);
  }

  const documents = await prisma.document.findMany({
    where: { patientId: params.id },
    orderBy: { createdAt: "desc" },
  });

  return apiOk(
    documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      type: doc.type,
      createdAt: doc.createdAt.toLocaleDateString(),
    })),
  );
}
