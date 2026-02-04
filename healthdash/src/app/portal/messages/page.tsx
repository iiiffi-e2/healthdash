"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortalPatient } from "@/hooks/use-portal-patient";

type ThreadRow = {
  id: string;
  subject: string;
  lastMessageAt: string;
  lastMessagePreview: string;
};

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(payload.error?.message ?? "Request failed");
  }
  return payload.data;
}

export default function PortalMessagesPage() {
  const { patient, isLoading } = usePortalPatient();
  const threadsQuery = useQuery({
    queryKey: ["portal-threads", patient?.id],
    queryFn: () =>
      fetcher<ThreadRow[]>(`/api/threads?patientId=${patient?.id ?? ""}`),
    enabled: !!patient?.id,
  });

  if (isLoading || threadsQuery.isLoading) {
    return <Skeleton className="h-[420px] w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Messages</h1>
        <p className="text-sm text-muted-foreground">
          Secure chat with your care team.
        </p>
      </div>
      <div className="grid gap-4">
        {(threadsQuery.data ?? []).map((thread) => (
          <Card key={thread.id} className="rounded-2xl border-border/60">
            <CardContent className="p-6">
              <p className="text-sm font-semibold text-foreground">
                {thread.subject}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {thread.lastMessagePreview}
              </p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Last updated {thread.lastMessageAt}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
