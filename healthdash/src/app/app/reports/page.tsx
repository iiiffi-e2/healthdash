"use client";

import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercent } from "@/lib/format";

type ClaimsKpis = {
  pendingCount: number;
  pendingAmountCents: number;
  approvedCount: number;
  deniedCount: number;
  approvalRate: number;
  flagged: { id: string; patient: string; amount: number }[];
};

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(payload.error?.message ?? "Request failed");
  }
  return payload.data;
}

export default function ReportsPage() {
  const kpiQuery = useQuery({
    queryKey: ["claims-kpis", 90],
    queryFn: () => fetcher<ClaimsKpis>("/api/reports/claims-kpis?windowDays=90"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Claims KPIs with export-ready data.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/api/reports/export?type=claims" target="_blank" rel="noreferrer">
              Export claims CSV
            </a>
          </Button>
          <Button asChild>
            <a href="/api/reports/export?type=appointments" target="_blank" rel="noreferrer">
              Export appointments CSV
            </a>
          </Button>
        </div>
      </div>

      {kpiQuery.isLoading ? (
        <Skeleton className="h-[160px] w-full rounded-2xl" />
      ) : kpiQuery.data ? (
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Pending claims"
            value={`${kpiQuery.data.pendingCount}`}
            helper={formatCurrency(kpiQuery.data.pendingAmountCents)}
          />
          <MetricCard
            title="Approved (90 days)"
            value={`${kpiQuery.data.approvedCount}`}
            helper={`Denied ${kpiQuery.data.deniedCount}`}
          />
          <MetricCard
            title="Approval rate"
            value={formatPercent(kpiQuery.data.approvalRate)}
            helper="Last 90 days"
          />
        </div>
      ) : null}
    </div>
  );
}
