"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { usePortalPatient } from "@/hooks/use-portal-patient";

type AppointmentRow = {
  id: string;
  startAt: string;
  provider: string;
  location: string;
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

export default function PortalAppointmentsPage() {
  const { patient, isLoading } = usePortalPatient();
  const appointmentsQuery = useQuery({
    queryKey: ["portal-appointments", patient?.id],
    queryFn: () =>
      fetcher<AppointmentRow[]>(
        `/api/appointments?patientId=${patient?.id ?? ""}`,
      ),
    enabled: !!patient?.id,
  });

  if (isLoading || appointmentsQuery.isLoading) {
    return <Skeleton className="h-[420px] w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Appointments</h1>
        <p className="text-sm text-muted-foreground">
          Upcoming and recent visits with your care team.
        </p>
      </div>
      <div className="grid gap-4">
        {(appointmentsQuery.data ?? []).map((appointment) => (
          <Card key={appointment.id} className="rounded-2xl border-border/60">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {appointment.startAt}
                </p>
                <p className="text-xs text-muted-foreground">
                  {appointment.provider} · {appointment.location}
                </p>
              </div>
              <StatusBadge status={appointment.status} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
