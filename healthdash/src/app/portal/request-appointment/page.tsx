"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePortalPatient } from "@/hooks/use-portal-patient";

const requestSchema = z.object({
  preferredStart: z.string().min(1, "Select a preferred date."),
  preferredEnd: z.string().min(1, "Select a preferred end date."),
  reason: z.string().min(3, "Tell us what you need help with."),
});

type RequestForm = z.infer<typeof requestSchema>;

export default function RequestAppointmentPage() {
  const { patient } = usePortalPatient();
  const form = useForm<RequestForm>({
    resolver: zodResolver(requestSchema),
  });

  const onSubmit = async (values: RequestForm) => {
    if (!patient) {
      toast.error("Unable to load patient.");
      return;
    }

    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: patient.id,
        appointmentTypeId: undefined,
        preferredStartAt: values.preferredStart,
        preferredEndAt: values.preferredEnd,
        priority: 3,
        note: values.reason,
      }),
    });
    const payload = await response.json();
    if (!payload.ok) {
      toast.error(payload.error?.message ?? "Unable to submit request.");
      return;
    }

    toast.success("Request received. We'll confirm soon.");
    form.reset();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Request an appointment
        </h1>
        <p className="text-sm text-muted-foreground">
          Share your preferred window and our team will follow up.
        </p>
      </div>
      <Card className="rounded-2xl border-border/60">
        <CardContent className="space-y-4 p-6">
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="preferredStart">Preferred start</Label>
                <Input
                  id="preferredStart"
                  type="datetime-local"
                  {...form.register("preferredStart")}
                />
                <p className="text-xs text-destructive">
                  {form.formState.errors.preferredStart?.message}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredEnd">Preferred end</Label>
                <Input
                  id="preferredEnd"
                  type="datetime-local"
                  {...form.register("preferredEnd")}
                />
                <p className="text-xs text-destructive">
                  {form.formState.errors.preferredEnd?.message}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for visit</Label>
              <Textarea id="reason" {...form.register("reason")} />
              <p className="text-xs text-destructive">
                {form.formState.errors.reason?.message}
              </p>
            </div>
            <Button type="submit">Submit request</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
