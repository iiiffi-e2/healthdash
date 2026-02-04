"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { usePortalPatient } from "@/hooks/use-portal-patient";
import { formatCurrency } from "@/lib/format";

type InvoiceRow = {
  id: string;
  totalAmountCents: number;
  balanceCents: number;
  status: string;
  createdAt: string;
};

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(payload.error?.message ?? "Request failed");
  }
  return payload.data;
}

export default function PortalBillingPage() {
  const { patient, isLoading } = usePortalPatient();
  const invoicesQuery = useQuery({
    queryKey: ["portal-invoices", patient?.id],
    queryFn: () =>
      fetcher<InvoiceRow[]>(
        `/api/invoices?patientId=${patient?.id ?? ""}`,
      ),
    enabled: !!patient?.id,
  });

  if (isLoading || invoicesQuery.isLoading) {
    return <Skeleton className="h-[420px] w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Review balances and payment history.
        </p>
      </div>
      <div className="grid gap-4">
        {(invoicesQuery.data ?? []).map((invoice) => (
          <Card key={invoice.id} className="rounded-2xl border-border/60">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Invoice {invoice.id.slice(0, 6)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Created {invoice.createdAt}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">
                  {formatCurrency(invoice.balanceCents)}
                </p>
                <StatusBadge status={invoice.status} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
