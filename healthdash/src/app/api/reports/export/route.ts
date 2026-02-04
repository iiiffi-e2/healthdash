import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";

const querySchema = z.object({
  type: z.enum(["claims", "appointments", "patients"]),
});

function toCsv(headers: string[], rows: Record<string, unknown>[]) {
  const escape = (value: unknown) =>
    `"${String(value ?? "")
      .replaceAll('"', '""')
      .replaceAll("\n", " ")}"`;

  const body = rows
    .map((row) => headers.map((header) => escape(row[header])).join(","))
    .join("\n");

  return `${headers.join(",")}\n${body}`;
}

export async function GET(request: Request) {
  const { error } = await requireApiUser(Permissions.VIEW_REPORTS);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    type: searchParams.get("type"),
  });
  if (!parsed.success) {
    return apiError("INVALID_QUERY", "Invalid export type.", 400, parsed.error);
  }

  if (parsed.data.type === "claims") {
    const claims = await prisma.claim.findMany({
      include: { patient: true },
    });
    const headers = ["id", "patient", "status", "payerName", "amountBilledCents"];
    const rows = claims.map((claim) => ({
      id: claim.id,
      patient: `${claim.patient.firstName} ${claim.patient.lastName}`,
      status: claim.status,
      payerName: claim.payerName,
      amountBilledCents: claim.amountBilledCents,
    }));
    return new Response(toCsv(headers, rows), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=claims.csv",
      },
    });
  }

  if (parsed.data.type === "appointments") {
    const appointments = await prisma.appointment.findMany({
      include: { patient: true, provider: true, location: true },
    });
    const headers = [
      "id",
      "patient",
      "provider",
      "location",
      "status",
      "startAt",
      "endAt",
    ];
    const rows = appointments.map((appointment) => ({
      id: appointment.id,
      patient: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      provider: appointment.provider.name,
      location: appointment.location.name,
      status: appointment.status,
      startAt: appointment.startAt.toISOString(),
      endAt: appointment.endAt.toISOString(),
    }));
    return new Response(toCsv(headers, rows), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=appointments.csv",
      },
    });
  }

  const patients = await prisma.patient.findMany();
  const headers = ["id", "firstName", "lastName", "email", "phone", "dob"];
  const rows = patients.map((patient) => ({
    id: patient.id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    email: patient.email ?? "",
    phone: patient.phone ?? "",
    dob: patient.dob.toISOString(),
  }));

  return new Response(toCsv(headers, rows), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=patients.csv",
    },
  });
}
