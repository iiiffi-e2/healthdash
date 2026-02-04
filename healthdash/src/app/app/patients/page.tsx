"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type PatientRow = {
  id: string;
  name: string;
  dob: string;
  email: string | null;
  phone: string | null;
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

export default function PatientsPage() {
  const patientsQuery = useQuery({
    queryKey: ["patients"],
    queryFn: () => fetcher<PatientRow[]>("/api/patients?query=&page=1"),
  });

  const columns: ColumnDef<PatientRow>[] = [
    {
      header: "Patient",
      accessorKey: "name",
      cell: ({ row }) => (
        <div className="space-y-1">
          <Link
            href={`/app/patients/${row.original.id}`}
            className="text-sm font-semibold text-foreground hover:underline"
          >
            {row.original.name}
          </Link>
          <p className="text-xs text-muted-foreground">{row.original.email}</p>
        </div>
      ),
    },
    {
      header: "DOB",
      accessorKey: "dob",
    },
    {
      header: "Phone",
      accessorKey: "phone",
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }) => (
        <Button asChild size="sm" variant="outline">
          <Link href={`/app/patients/${row.original.id}`}>View</Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Patients</h1>
          <p className="text-sm text-muted-foreground">
            Search, manage, and update patient records.
          </p>
        </div>
        <Button asChild>
          <Link href="/app/patients?new=true">Add patient</Link>
        </Button>
      </div>
      {patientsQuery.isLoading ? (
        <Skeleton className="h-[420px] w-full rounded-2xl" />
      ) : (
        <DataTable
          columns={columns}
          data={patientsQuery.data ?? []}
          searchKey="name"
          searchPlaceholder="Search patients..."
        />
      )}
    </div>
  );
}
