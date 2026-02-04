"use client";

import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";

type StaffRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
};

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(payload.error?.message ?? "Request failed");
  }
  return payload.data;
}

export default function StaffPage() {
  const staffQuery = useQuery({
    queryKey: ["staff"],
    queryFn: () => fetcher<StaffRow[]>("/api/staff"),
  });

  const columns: ColumnDef<StaffRow>[] = [
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Role",
      accessorKey: "role",
      cell: ({ row }) => <StatusBadge status={row.original.role} />,
    },
    {
      header: "Status",
      accessorKey: "isActive",
      cell: ({ row }) => (row.original.isActive ? "Active" : "Inactive"),
    },
    {
      header: "Actions",
      id: "actions",
      cell: () => (
        <Button size="sm" variant="outline">
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Staff</h1>
          <p className="text-sm text-muted-foreground">
            Manage roles, schedules, and access.
          </p>
        </div>
        <Button>Create staff member</Button>
      </div>
      {staffQuery.isLoading ? (
        <Skeleton className="h-[420px] w-full rounded-2xl" />
      ) : (
        <DataTable
          columns={columns}
          data={staffQuery.data ?? []}
          searchKey="name"
          searchPlaceholder="Search staff..."
        />
      )}
    </div>
  );
}
