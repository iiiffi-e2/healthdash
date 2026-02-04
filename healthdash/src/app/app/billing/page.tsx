"use client";

import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";

type InvoiceRow = {
  id: string;
  patient: string;
  totalAmountCents: number;
  balanceCents: number;
  status: string;
};

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(payload.error?.message ?? "Request failed");
  }
  return payload.data;
}

export default function BillingPage() {
  const invoicesQuery = useQuery({
    queryKey: ["invoices"],
    queryFn: () => fetcher<InvoiceRow[]>("/api/invoices?status=&page=1"),
  });

  const columns: ColumnDef<InvoiceRow>[] = [
    {
      header: "Invoice",
      accessorKey: "id",
    },
    {
      header: "Patient",
      accessorKey: "patient",
    },
    {
      header: "Total",
      accessorKey: "totalAmountCents",
      cell: ({ row }) => formatCurrency(row.original.totalAmountCents),
    },
    {
      header: "Balance",
      accessorKey: "balanceCents",
      cell: ({ row }) => formatCurrency(row.original.balanceCents),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      header: "Actions",
      id: "actions",
      cell: () => (
        <Button size="sm" variant="outline">
          Record payment
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Billing</h1>
          <p className="text-sm text-muted-foreground">
            Invoices, payments, and account balances.
          </p>
        </div>
        <Button>Create invoice</Button>
      </div>
      {invoicesQuery.isLoading ? (
        <Skeleton className="h-[420px] w-full rounded-2xl" />
      ) : (
        <DataTable
          columns={columns}
          data={invoicesQuery.data ?? []}
          searchKey="patient"
          searchPlaceholder="Search invoices..."
        />
      )}
    </div>
  );
}
