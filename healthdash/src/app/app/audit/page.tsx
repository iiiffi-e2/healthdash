"use client";

import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";

type AuditRow = {
  id: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
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

export default function AuditPage() {
  const auditQuery = useQuery({
    queryKey: ["audit"],
    queryFn: () => fetcher<AuditRow[]>("/api/audit?page=1"),
  });

  const columns: ColumnDef<AuditRow>[] = [
    {
      header: "Actor",
      accessorKey: "actor",
    },
    {
      header: "Action",
      accessorKey: "action",
      cell: ({ row }) => <StatusBadge status={row.original.action} />,
    },
    {
      header: "Entity",
      accessorKey: "entityType",
    },
    {
      header: "ID",
      accessorKey: "entityId",
    },
    {
      header: "Time",
      accessorKey: "createdAt",
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Audit log</h1>
        <p className="text-sm text-muted-foreground">
          All create/update/delete and status changes.
        </p>
      </div>
      {auditQuery.isLoading ? (
        <Skeleton className="h-[420px] w-full rounded-2xl" />
      ) : (
        <DataTable
          columns={columns}
          data={auditQuery.data ?? []}
          searchKey="actor"
          searchPlaceholder="Search audit log..."
        />
      )}
    </div>
  );
}
