"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PatientDetail = {
  id: string;
  name: string;
  dob: string;
  email?: string;
  phone?: string;
  status: string;
  address?: string;
};

type PatientSummary = {
  upcomingAppointments: number;
  openClaims: number;
  balanceCents: number;
};

type PatientDocument = {
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

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const patientId = params?.id as string;

  const patientQuery = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => fetcher<PatientDetail>(`/api/patients/${patientId}`),
    enabled: !!patientId,
  });

  const summaryQuery = useQuery({
    queryKey: ["patient-summary", patientId],
    queryFn: () => fetcher<PatientSummary>(`/api/patients/${patientId}/summary`),
    enabled: !!patientId,
  });

  const documentsQuery = useQuery({
    queryKey: ["patient-documents", patientId],
    queryFn: () => fetcher<PatientDocument[]>(`/api/patients/${patientId}/documents`),
    enabled: !!patientId,
  });

  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  if (patientQuery.isLoading || summaryQuery.isLoading) {
    return <Skeleton className="h-[520px] w-full rounded-2xl" />;
  }

  const patient = patientQuery.data;
  const summary = summaryQuery.data;

  if (!patient || !summary) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        Patient not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{patient.name}</h1>
          <p className="text-sm text-muted-foreground">
            DOB {patient.dob} · {patient.email ?? "No email"}
          </p>
        </div>
        <StatusBadge status={patient.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border-border/60">
          <CardHeader>Upcoming appointments</CardHeader>
          <CardContent className="text-2xl font-semibold">
            {summary.upcomingAppointments}
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60">
          <CardHeader>Open claims</CardHeader>
          <CardContent className="text-2xl font-semibold">
            {summary.openClaims}
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/60">
          <CardHeader>Balance</CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatCurrency(summary.balanceCents)}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card className="rounded-2xl border-border/60">
            <CardContent className="space-y-2 p-6 text-sm text-muted-foreground">
              <p>
                Address:{" "}
                <span className="text-foreground">{patient.address ?? "N/A"}</span>
              </p>
              <p>
                Phone:{" "}
                <span className="text-foreground">{patient.phone ?? "N/A"}</span>
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="appointments">
          <Card className="rounded-2xl border-border/60">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Appointment history will appear here.
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="claims">
          <Card className="rounded-2xl border-border/60">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Claim details and status timeline will appear here.
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="billing">
          <Card className="rounded-2xl border-border/60">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Invoices and payments will appear here.
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="documents">
          <Card className="rounded-2xl border-border/60">
            <CardHeader>Documents</CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  type="file"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
                <Button
                  disabled={!file || uploading}
                  onClick={async () => {
                    if (!file) return;
                    setUploading(true);
                    try {
                      const formData = new FormData();
                      formData.append("file", file);
                      const uploadResponse = await fetch("/api/documents/upload", {
                        method: "POST",
                        body: formData,
                      });
                      const uploadPayload = await uploadResponse.json();
                      if (!uploadPayload.ok) {
                        throw new Error(uploadPayload.error?.message ?? "Upload failed");
                      }

                      const documentResponse = await fetch("/api/documents", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          patientId,
                          title: file.name,
                          type: file.type || "Document",
                          storageKey: uploadPayload.data.storageKey,
                          mimeType: uploadPayload.data.mimeType,
                          sizeBytes: uploadPayload.data.sizeBytes,
                        }),
                      });
                      const documentPayload = await documentResponse.json();
                      if (!documentPayload.ok) {
                        throw new Error(documentPayload.error?.message ?? "Unable to save.");
                      }

                      toast.success("Document uploaded.");
                      setFile(null);
                      documentsQuery.refetch();
                    } catch (error) {
                      toast.error((error as Error).message);
                    } finally {
                      setUploading(false);
                    }
                  }}
                >
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                {(documentsQuery.data ?? []).map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between">
                    <span>
                      {doc.title} · {doc.type}
                    </span>
                    <a
                      className="text-primary hover:underline"
                      href={`/api/documents/${doc.id}/download`}
                    >
                      Download
                    </a>
                  </div>
                ))}
                {documentsQuery.data?.length === 0 ? (
                  <p>No documents uploaded yet.</p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="messages">
          <Card className="rounded-2xl border-border/60">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Secure messages will appear here.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
