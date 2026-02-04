"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";

type AppointmentDetail = {
  id: string;
  patientName: string;
  providerName: string;
  locationName: string;
  startAt: string;
  endAt: string;
  status: string;
  reason?: string;
  notes?: string;
};

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(payload.error?.message ?? "Request failed");
  }
  return payload.data;
}

export default function AppointmentDetailPage() {
  const params = useParams<{ id: string }>();
  const appointmentId = params?.id as string;
  const appointmentQuery = useQuery({
    queryKey: ["appointment", appointmentId],
    queryFn: () => fetcher<AppointmentDetail>(`/api/appointments/${appointmentId}`),
    enabled: !!appointmentId,
  });

  if (appointmentQuery.isLoading) {
    return <Skeleton className="h-[420px] w-full rounded-2xl" />;
  }

  const appointment = appointmentQuery.data;
  if (!appointment) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        Appointment not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Appointment overview
          </h1>
          <p className="text-sm text-muted-foreground">
            {appointment.patientName} · {appointment.providerName}
          </p>
        </div>
        <StatusBadge status={appointment.status} />
      </div>
      <Card className="rounded-2xl border-border/60">
        <CardHeader>Appointment details</CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <span className="text-foreground">When:</span> {appointment.startAt}
            {" - "}
            {appointment.endAt}
          </p>
          <p>
            <span className="text-foreground">Location:</span>{" "}
            {appointment.locationName}
          </p>
          <p>
            <span className="text-foreground">Reason:</span>{" "}
            {appointment.reason ?? "N/A"}
          </p>
          <p>
            <span className="text-foreground">Notes:</span>{" "}
            {appointment.notes ?? "N/A"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
