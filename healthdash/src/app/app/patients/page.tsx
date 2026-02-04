"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table";
import { DrawerForm } from "@/components/overlay/drawer-form";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type PatientRow = {
  id: string;
  name: string;
  dob: string;
  email: string | null;
  phone: string | null;
  status: string;
};

const patientSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  dob: z.string().min(1, "Date of birth is required."),
  email: z
    .string()
    .email("Enter a valid email.")
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
});

type PatientForm = z.infer<typeof patientSchema>;

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(payload.error?.message ?? "Request failed");
  }
  return payload.data;
}

export default function PatientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewPatient = searchParams.get("new") === "true";
  const [isSaving, setIsSaving] = useState(false);

  const patientsQuery = useQuery({
    queryKey: ["patients"],
    queryFn: () => fetcher<PatientRow[]>("/api/patients?query=&page=1"),
  });

  const form = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dob: "",
      email: "",
      phone: "",
    },
  });

  const handleOpenChange = (open: boolean) => {
    if (open) return;
    form.reset();
    router.replace("/app/patients");
  };

  const onSubmit = async (values: PatientForm) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          dob: values.dob,
          email: values.email ? values.email : undefined,
          phone: values.phone ? values.phone : undefined,
        }),
      });
      const payload = await response.json();
      if (!payload.ok) {
        throw new Error(payload.error?.message ?? "Unable to add patient.");
      }

      toast.success("Patient created.");
      patientsQuery.refetch();
      form.reset();
      router.replace("/app/patients");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

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
      <DrawerForm
        open={isNewPatient}
        onOpenChange={handleOpenChange}
        title="New patient"
        description="Add a patient record to the directory."
      >
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" {...form.register("firstName")} />
              <p className="text-xs text-destructive">
                {form.formState.errors.firstName?.message}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" {...form.register("lastName")} />
              <p className="text-xs text-destructive">
                {form.formState.errors.lastName?.message}
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dob">Date of birth</Label>
              <Input id="dob" type="date" {...form.register("dob")} />
              <p className="text-xs text-destructive">
                {form.formState.errors.dob?.message}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" {...form.register("phone")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} />
            <p className="text-xs text-destructive">
              {form.formState.errors.email?.message}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Create patient"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DrawerForm>
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
