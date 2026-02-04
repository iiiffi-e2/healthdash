import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";
import { storageProvider } from "@/lib/storage";

export async function POST(request: Request) {
  const { error } = await requireApiUser(Permissions.MANAGE_DOCUMENTS);
  if (error) return error;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return apiError("INVALID_REQUEST", "File is required.", 400);
  }

  const result = await storageProvider.save(file);

  return apiOk(result);
}
