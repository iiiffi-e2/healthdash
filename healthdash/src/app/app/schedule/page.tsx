"use client";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { DrawerForm } from "@/components/overlay/drawer-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { useRealtime } from "@/hooks/use-realtime";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";

type Provider = {
  id: string;
  name: string;
  color: string;
};

type Location = {
  id: string;
  name: string;
};

type AppointmentType = {
  id: string;
  name: string;
};

type Appointment = {
  id: string;
  title: string;
  start: string;
  end: string;
  providerId: string;
  status: string;
};

type PatientOption = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
};

type PatientRow = {
  id: string;
  name: string;
  dob: string;
  email: string | null;
  phone: string | null;
  status: string;
};

const appointmentSchema = z.object({
  patientId: z.string().min(1, "Select a patient."),
  providerId: z.string().min(1, "Select a provider."),
  locationId: z.string().min(1, "Select a location."),
  appointmentTypeId: z.string().min(1, "Select an appointment type."),
  startAt: z.string().min(1, "Choose a start time."),
  endAt: z.string().optional(),
});

type AppointmentForm = z.infer<typeof appointmentSchema>;

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

export default function SchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewAppointment = searchParams.get("new") === "true";

  const providersQuery = useQuery({
    queryKey: ["providers"],
    queryFn: () => fetcher<Provider[]>("/api/providers"),
  });

  const locationsQuery = useQuery({
    queryKey: ["locations"],
    queryFn: () => fetcher<Location[]>("/api/locations"),
  });

  const appointmentTypesQuery = useQuery({
    queryKey: ["appointment-types"],
    queryFn: () => fetcher<AppointmentType[]>("/api/appointment-types"),
  });

  const appointmentsQuery = useQuery({
    queryKey: ["appointments"],
    queryFn: () =>
      fetcher<Appointment[]>(
        `/api/appointments?start=${new Date().toISOString()}&end=${new Date(
          Date.now() + 1000 * 60 * 60 * 24 * 7,
        ).toISOString()}`,
      ),
  });

  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);
  const [showCreatePatient, setShowCreatePatient] = useState(false);
  const [isSavingAppointment, setIsSavingAppointment] = useState(false);
  const [isSavingPatient, setIsSavingPatient] = useState(false);

  const patientResultsQuery = useQuery({
    queryKey: ["patients", "search", patientSearch],
    queryFn: () =>
      fetcher<PatientRow[]>(
        `/api/patients?query=${encodeURIComponent(patientSearch)}&page=1`,
      ),
    enabled: patientSearch.trim().length >= 2,
  });

  const appointmentForm = useForm<AppointmentForm>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientId: "",
      providerId: "",
      locationId: "",
      appointmentTypeId: "",
      startAt: "",
      endAt: "",
    },
  });

  const patientForm = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dob: "",
      email: "",
      phone: "",
    },
  });

  useRealtime(() => {
    appointmentsQuery.refetch();
  });

  const resources = useMemo(
    () =>
      (providersQuery.data ?? []).map((provider) => ({
        id: provider.id,
        title: provider.name,
        eventColor: provider.color,
      })),
    [providersQuery.data],
  );

  const events = useMemo(
    () =>
      (appointmentsQuery.data ?? []).map((appointment) => ({
        id: appointment.id,
        title: appointment.title,
        start: appointment.start,
        end: appointment.end,
        resourceId: appointment.providerId,
        extendedProps: { status: appointment.status },
      })),
    [appointmentsQuery.data],
  );

  const handleOpenChange = (open: boolean) => {
    if (open) return;
    appointmentForm.reset();
    patientForm.reset();
    setPatientSearch("");
    setSelectedPatient(null);
    setShowCreatePatient(false);
    router.replace("/app/schedule");
  };

  const handleSelectPatient = (patient: PatientOption) => {
    setSelectedPatient(patient);
    appointmentForm.setValue("patientId", patient.id, { shouldValidate: true });
    setPatientSearch(patient.name);
    setShowCreatePatient(false);
  };

  const handleClearPatient = () => {
    setSelectedPatient(null);
    appointmentForm.setValue("patientId", "", { shouldValidate: true });
    setPatientSearch("");
  };

  const onSubmitAppointment = async (values: AppointmentForm) => {
    setIsSavingAppointment(true);
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: values.patientId,
          providerId: values.providerId,
          locationId: values.locationId,
          appointmentTypeId: values.appointmentTypeId,
          startAt: values.startAt,
          endAt: values.endAt || undefined,
        }),
      });
      const payload = await response.json();
      if (!payload.ok) {
        throw new Error(payload.error?.message ?? "Unable to schedule appointment.");
      }

      toast.success("Appointment scheduled.");
      appointmentsQuery.refetch();
      handleOpenChange(false);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSavingAppointment(false);
    }
  };

  const onSubmitPatient = async (values: PatientForm) => {
    setIsSavingPatient(true);
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

      const patient = payload.data;
      handleSelectPatient({
        id: patient.id,
        name: `${patient.firstName} ${patient.lastName}`,
        email: patient.email,
        phone: patient.phone,
      });
      patientForm.reset();
      toast.success("Patient created.");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSavingPatient(false);
    }
  };

  if (providersQuery.isLoading) {
    return <Skeleton className="h-[640px] w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Schedule</h1>
          <p className="text-sm text-muted-foreground">
            Multi-provider calendar with real-time conflict checks.
          </p>
        </div>
        <Button asChild>
          <Link href="/app/schedule?new=true">Schedule appointment</Link>
        </Button>
      </div>
      <DrawerForm
        open={isNewAppointment}
        onOpenChange={handleOpenChange}
        title="Schedule appointment"
        description="Select an existing patient and book their visit."
      >
        <form className="space-y-5" onSubmit={appointmentForm.handleSubmit(onSubmitAppointment)}>
          <input type="hidden" {...appointmentForm.register("patientId")} />
          <div className="space-y-2">
            <Label htmlFor="patientSearch">Patient</Label>
            <Input
              id="patientSearch"
              value={patientSearch}
              onChange={(event) => {
                setPatientSearch(event.target.value);
                setSelectedPatient(null);
                appointmentForm.setValue("patientId", "", { shouldValidate: true });
              }}
              placeholder="Search patients by name or email..."
            />
            {selectedPatient ? (
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Selected: <span className="text-foreground">{selectedPatient.name}</span>
                </span>
                <Button type="button" size="sm" variant="ghost" onClick={handleClearPatient}>
                  Clear
                </Button>
              </div>
            ) : null}
            {!selectedPatient && patientSearch.trim().length >= 2 ? (
              <div className="rounded-md border border-border/60 bg-card p-2">
                {patientResultsQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Searching patients...</p>
                ) : (patientResultsQuery.data ?? []).length > 0 ? (
                  <div className="space-y-1">
                    {(patientResultsQuery.data ?? []).map((patient) => (
                      <Button
                        key={patient.id}
                        type="button"
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() =>
                          handleSelectPatient({
                            id: patient.id,
                            name: patient.name,
                            email: patient.email,
                            phone: patient.phone,
                          })
                        }
                      >
                        <span className="text-sm font-medium">{patient.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {patient.email ?? patient.phone ?? ""}
                        </span>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>No patients found. Create a new patient?</p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setShowCreatePatient(true)}
                    >
                      Create patient
                    </Button>
                  </div>
                )}
              </div>
            ) : null}
            <p className="text-xs text-destructive">
              {appointmentForm.formState.errors.patientId?.message}
            </p>
          </div>

          {showCreatePatient ? (
            <div className="rounded-md border border-border/60 bg-muted/30 p-4">
              <h3 className="text-sm font-semibold text-foreground">New patient</h3>
              <p className="text-xs text-muted-foreground">
                Create the patient first, then continue scheduling.
              </p>
              <div className="mt-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" {...patientForm.register("firstName")} />
                    <p className="text-xs text-destructive">
                      {patientForm.formState.errors.firstName?.message}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" {...patientForm.register("lastName")} />
                    <p className="text-xs text-destructive">
                      {patientForm.formState.errors.lastName?.message}
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of birth</Label>
                    <Input id="dob" type="date" {...patientForm.register("dob")} />
                    <p className="text-xs text-destructive">
                      {patientForm.formState.errors.dob?.message}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" {...patientForm.register("phone")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...patientForm.register("email")} />
                  <p className="text-xs text-destructive">
                    {patientForm.formState.errors.email?.message}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    disabled={isSavingPatient}
                    onClick={patientForm.handleSubmit(onSubmitPatient)}
                  >
                    {isSavingPatient ? "Saving..." : "Create patient"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowCreatePatient(false)}
                    disabled={isSavingPatient}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                value={appointmentForm.watch("providerId")}
                onValueChange={(value) =>
                  appointmentForm.setValue("providerId", value, { shouldValidate: true })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {(providersQuery.data ?? []).map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-destructive">
                {appointmentForm.formState.errors.providerId?.message}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Select
                value={appointmentForm.watch("locationId")}
                onValueChange={(value) =>
                  appointmentForm.setValue("locationId", value, { shouldValidate: true })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {(locationsQuery.data ?? []).map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-destructive">
                {appointmentForm.formState.errors.locationId?.message}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Appointment type</Label>
              <Select
                value={appointmentForm.watch("appointmentTypeId")}
                onValueChange={(value) =>
                  appointmentForm.setValue("appointmentTypeId", value, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {(appointmentTypesQuery.data ?? []).map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-destructive">
                {appointmentForm.formState.errors.appointmentTypeId?.message}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startAt">Start</Label>
              <Input id="startAt" type="datetime-local" {...appointmentForm.register("startAt")} />
              <p className="text-xs text-destructive">
                {appointmentForm.formState.errors.startAt?.message}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endAt">End (optional)</Label>
            <Input id="endAt" type="datetime-local" {...appointmentForm.register("endAt")} />
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSavingAppointment}>
              {isSavingAppointment ? "Scheduling..." : "Schedule appointment"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isSavingAppointment}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DrawerForm>
      <Card className="overflow-hidden rounded-2xl border-border/60 p-4">
        <FullCalendar
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            interactionPlugin,
            resourceTimeGridPlugin,
          ]}
          initialView="resourceTimeGridDay"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "resourceTimeGridDay,resourceTimeGridWeek,timeGridDay,dayGridMonth",
          }}
          resources={resources}
          events={events}
          editable
          selectable
          eventContent={(arg) => (
            <div className="flex flex-col gap-1 text-xs">
              <span className="font-semibold">{arg.event.title}</span>
              <StatusBadge status={arg.event.extendedProps.status} />
            </div>
          )}
          select={(selectionInfo) => {
            toast.info("Create appointment", {
              description: `Selected ${selectionInfo.start.toLocaleString()} - ${selectionInfo.end.toLocaleString()}`,
            });
          }}
          eventDrop={async (info) => {
            const response = await fetch(`/api/appointments/${info.event.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                startAt: info.event.start,
                endAt: info.event.end,
                providerId: info.event.getResources()[0]?.id,
              }),
            });
            const payload = await response.json();
            if (!payload.ok) {
              info.revert();
              toast.error(payload.error?.message ?? "Unable to reschedule.");
            } else {
              toast.success("Appointment updated.");
            }
          }}
          eventResize={async (info) => {
            const response = await fetch(`/api/appointments/${info.event.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                startAt: info.event.start,
                endAt: info.event.end,
              }),
            });
            const payload = await response.json();
            if (!payload.ok) {
              info.revert();
              toast.error(payload.error?.message ?? "Unable to update.");
            } else {
              toast.success("Appointment duration updated.");
            }
          }}
          height="auto"
        />
      </Card>
    </div>
  );
}
