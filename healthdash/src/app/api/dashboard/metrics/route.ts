import { apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";
import { getDashboardMetrics } from "@/lib/metrics";

export async function GET() {
  const { error } = await requireApiUser(Permissions.VIEW_DASHBOARD);
  if (error) return error;

  const metrics = await getDashboardMetrics();
  return apiOk(metrics);
}
