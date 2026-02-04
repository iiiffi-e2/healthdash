"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { Timeline } from "@/components/timeline";
import { formatCurrency } from "@/lib/format";

type ClaimDetail = {
  id: string;
  patient: string;
  payerName: string;
  amountBilledCents: number;
  amountPaidCents: number;
  status: string;
  flagged: boolean;
  denialReason?: string | null;
  timeline: {
    id: string;
    title: string;
    timestamp: string;
    description?: string;
  }[];
};

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(payload.error?.message ?? "Request failed");
  }
  return payload.data;
}

export default function ClaimDetailPage() {
  const params = useParams<{ id: string }>();
  const claimId = params?.id as string;
  const claimQuery = useQuery({
    queryKey: ["claim", claimId],
    queryFn: () => fetcher<ClaimDetail>(`/api/claims/${claimId}`),
    enabled: !!claimId,
  });

  if (claimQuery.isLoading) {
    return <Skeleton className="h-[420px] w-full rounded-2xl" />;
  }

  const claim = claimQuery.data;
  if (!claim) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        Claim not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Claim</h1>
          <p className="text-sm text-muted-foreground">
            {claim.patient} · {claim.payerName}
          </p>
        </div>
        <StatusBadge status={claim.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border-border/60">
          <CardHeader>Amount billed</CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrency(claim.amountBilledCents)}
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60">
          <CardHeader>Amount paid</CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrency(claim.amountPaidCents)}
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60">
          <CardHeader>Flagged</CardHeader>
          <CardContent className="text-2xl font-semibold">
            {claim.flagged ? "Yes" : "No"}
          </CardContent>
        </Card>
      </div>

      {claim.denialReason ? (
        <Card className="rounded-2xl border-destructive/30 bg-destructive/10 text-destructive">
          <CardContent className="p-6 text-sm">
            Denial reason: {claim.denialReason}
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-2xl border-border/60">
        <CardHeader>Status timeline</CardHeader>
        <CardContent>
          <Timeline items={claim.timeline} />
        </CardContent>
      </Card>
    </div>
  );
}
