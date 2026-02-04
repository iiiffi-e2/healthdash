"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ActivityFeed } from "@/components/activity-feed";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercent } from "@/lib/format";
import { useRealtime } from "@/hooks/use-realtime";

type MetricsResponse = {
  appointmentsToday: number;
  appointmentsCompletedToday: number;
  pendingClaims: number;
  pendingClaimsAmountCents: number;
  monthlyRevenueCents: number;
  activePatients: number;
  patientRetentionRate: number;
  noShowRate: number;
  avgVisitValueCents: number;
  lostRevenueRiskCents: number;
  revenueSeries: { month: string; amountCents: number }[];
};

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  tag?: string;
};

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(payload.error?.message ?? "Request failed");
  }
  return payload.data;
}

export default function DashboardPage() {
  const metricsQuery = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: () => fetcher<MetricsResponse>("/api/dashboard/metrics"),
  });
  const activityQuery = useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: () => fetcher<ActivityItem[]>("/api/dashboard/activity"),
  });

  useRealtime(() => {
    metricsQuery.refetch();
    activityQuery.refetch();
  });

  const metrics = metricsQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Real-time insight into scheduling, claims, and revenue.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics ? (
          <>
            <MetricCard
              title="Today's appointments"
              value={`${metrics.appointmentsToday}`}
              helper={`${metrics.appointmentsCompletedToday} completed`}
            />
            <MetricCard
              title="Pending claims"
              value={`${metrics.pendingClaims}`}
              helper={`${formatCurrency(metrics.pendingClaimsAmountCents)} unpaid`}
            />
            <MetricCard
              title="Monthly revenue"
              value={formatCurrency(metrics.monthlyRevenueCents)}
              helper={`Avg visit ${formatCurrency(metrics.avgVisitValueCents)}`}
            />
            <MetricCard
              title="Active patients"
              value={`${metrics.activePatients}`}
              helper={`Retention ${formatPercent(metrics.patientRetentionRate)}`}
            />
            <MetricCard
              title="No-show rate"
              value={formatPercent(metrics.noShowRate)}
              helper="Last 30 days"
            />
            <MetricCard
              title="Lost revenue risk"
              value={formatCurrency(metrics.lostRevenueRiskCents)}
              helper="Pending >30 days + denied >14 days"
              highlight
            />
          </>
        ) : (
          Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[120px] rounded-2xl" />
          ))
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="rounded-2xl border-border/60">
          <CardHeader>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Revenue trend
              </p>
              <p className="text-xs text-muted-foreground">
                Payments posted in the last 6 months.
              </p>
            </div>
          </CardHeader>
          <CardContent className="h-[260px]">
            {metrics ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.revenueSeries}>
                  <defs>
                    <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => `Month ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="amountCents"
                    stroke="var(--color-primary)"
                    fill="url(#revenue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-full w-full rounded-2xl" />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/60">
          <CardHeader>
            <p className="text-sm font-semibold text-foreground">
              Recent activity
            </p>
            <p className="text-xs text-muted-foreground">
              Live updates from schedules, claims, and billing.
            </p>
          </CardHeader>
          <CardContent>
            {activityQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <ActivityFeed items={activityQuery.data ?? []} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
