"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";

type ClaimRow = {
  id: string;
  patient: string;
  payerName: string;
  amountBilledCents: number;
  status: string;
  flagged: boolean;
};

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(payload.error?.message ?? "Request failed");
  }
  return payload.data;
}

export default function ClaimsPage() {
  const claimsQuery = useQuery({
    queryKey: ["claims"],
    queryFn: () => fetcher<ClaimRow[]>("/api/claims?status=&flagged=&page=1"),
  });

  const columns: ColumnDef<ClaimRow>[] = [
    {
      header: "Patient",
      accessorKey: "patient",
      cell: ({ row }) => (
        <Link
          href={`/app/claims/${row.original.id}`}
          className="text-sm font-semibold text-foreground hover:underline"
        >
          {row.original.patient}
        </Link>
      ),
    },
    {
      header: "Payer",
      accessorKey: "payerName",
    },
    {
      header: "Billed",
      accessorKey: "amountBilledCents",
      cell: ({ row }) => formatCurrency(row.original.amountBilledCents),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      header: "Flagged",
      accessorKey: "flagged",
      cell: ({ row }) => (row.original.flagged ? "Yes" : "—"),
    },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }) => (
        <Button asChild size="sm" variant="outline">
          <Link href={`/app/claims/${row.original.id}`}>Review</Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Claims</h1>
          <p className="text-sm text-muted-foreground">
            Track submissions, approvals, and denials.
          </p>
        </div>
        <Button asChild>
          <Link href="/app/claims?new=true">Create claim</Link>
        </Button>
      </div>
      {claimsQuery.isLoading ? (
        <Skeleton className="h-[420px] w-full rounded-2xl" />
      ) : (
        <DataTable
          columns={columns}
          data={claimsQuery.data ?? []}
          searchKey="patient"
          searchPlaceholder="Search claims..."
        />
      )}
    </div>
  );
}
