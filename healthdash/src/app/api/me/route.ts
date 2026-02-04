import { apiOk, requireApiUser } from "@/lib/api";

export async function GET() {
  const { error, user } = await requireApiUser();
  if (error) return error;

  return apiOk({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
  });
}
