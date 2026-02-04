"use client";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
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

type Appointment = {
  id: string;
  title: string;
  start: string;
  end: string;
  providerId: string;
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

export default function SchedulePage() {
  const providersQuery = useQuery({
    queryKey: ["providers"],
    queryFn: () => fetcher<Provider[]>("/api/providers"),
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

  if (providersQuery.isLoading) {
    return <Skeleton className="h-[640px] w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Schedule</h1>
        <p className="text-sm text-muted-foreground">
          Multi-provider calendar with real-time conflict checks.
        </p>
      </div>
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
