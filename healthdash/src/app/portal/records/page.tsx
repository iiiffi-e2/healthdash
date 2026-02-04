"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortalPatient } from "@/hooks/use-portal-patient";

type DocumentRow = {
  id: string;
  title: string;
  type: string;
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

export default function PortalRecordsPage() {
  const { patient, isLoading } = usePortalPatient();
  const documentsQuery = useQuery({
    queryKey: ["portal-documents", patient?.id],
    queryFn: () =>
      fetcher<DocumentRow[]>(
        `/api/patients/${patient?.id ?? ""}/documents`,
      ),
    enabled: !!patient?.id,
  });

  if (isLoading || documentsQuery.isLoading) {
    return <Skeleton className="h-[420px] w-full rounded-2xl" />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Records</h1>
        <p className="text-sm text-muted-foreground">
          Visit summaries, documents, and clinical notes.
        </p>
      </div>
      <div className="grid gap-4">
        {(documentsQuery.data ?? []).map((doc) => (
          <Card key={doc.id} className="rounded-2xl border-border/60">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
              <div>
                <p className="text-sm font-semibold text-foreground">{doc.title}</p>
                <p className="text-xs text-muted-foreground">
                  {doc.type} · {doc.createdAt}
                </p>
              </div>
              <a
                className="text-sm font-medium text-primary hover:underline"
                href={`/api/documents/${doc.id}/download`}
              >
                Download
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
