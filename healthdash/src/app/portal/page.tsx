"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortalPatient } from "@/hooks/use-portal-patient";
import { formatCurrency } from "@/lib/format";

type PatientSummary = {
  upcomingAppointments: number;
  openClaims: number;
  balanceCents: number;
};

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(payload.error?.message ?? "Request failed");
  }
  return payload.data;
}

export default function PortalHomePage() {
  const { patient, isLoading } = usePortalPatient();
  const summaryQuery = useQuery({
    queryKey: ["portal-summary", patient?.id],
    queryFn: () => fetcher<PatientSummary>(`/api/patients/${patient?.id}/summary`),
    enabled: !!patient?.id,
  });

  if (isLoading || summaryQuery.isLoading) {
    return <Skeleton className="h-[420px] w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Here’s a snapshot of your upcoming care and account.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border-border/60">
          <CardHeader>Upcoming visits</CardHeader>
          <CardContent className="text-2xl font-semibold">
            {summaryQuery.data?.upcomingAppointments ?? 0}
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60">
          <CardHeader>Open claims</CardHeader>
          <CardContent className="text-2xl font-semibold">
            {summaryQuery.data?.openClaims ?? 0}
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60">
          <CardHeader>Balance</CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrency(summaryQuery.data?.balanceCents ?? 0)}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-border/60">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Need to reschedule or request a visit?
            </h3>
            <p className="text-sm text-muted-foreground">
              Send a request and our team will confirm availability.
            </p>
          </div>
          <Button asChild>
            <Link href="/portal/request-appointment">Request appointment</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
