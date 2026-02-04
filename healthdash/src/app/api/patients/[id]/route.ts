import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";

const updateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dob: z.string().optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  addressJson: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireApiUser(Permissions.MANAGE_PATIENTS);
  if (error) return error;

  const { id } = await params;
  const patient = await prisma.patient.findUnique({
    where: { id },
  });
  if (!patient) {
    return apiError("NOT_FOUND", "Patient not found.", 404);
  }

  return apiOk({
    id: patient.id,
    name: `${patient.firstName} ${patient.lastName}`,
    dob: patient.dob.toLocaleDateString(),
    email: patient.email,
    phone: patient.phone,
    status: patient.isActive ? "ACTIVE" : "INACTIVE",
    address: patient.addressJson
      ? `${patient.addressJson.line1 ?? ""} ${patient.addressJson.city ?? ""}`.trim()
      : undefined,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error, user } = await requireApiUser(Permissions.MANAGE_PATIENTS);
  if (error) return error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Invalid patient payload.", 400, parsed.error);
  }

  const existing = await prisma.patient.findUnique({
    where: { id },
  });
  if (!existing) {
    return apiError("NOT_FOUND", "Patient not found.", 404);
  }

  const updated = await prisma.patient.update({
    where: { id },
    data: {
      ...parsed.data,
      dob: parsed.data.dob ? new Date(parsed.data.dob) : undefined,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "UPDATE",
      entityType: "Patient",
      entityId: updated.id,
      beforeJson: existing,
      afterJson: updated,
    },
  });

  return apiOk(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error, user } = await requireApiUser(Permissions.MANAGE_PATIENTS);
  if (error) return error;

  const { id } = await params;
  const existing = await prisma.patient.findUnique({
    where: { id },
  });
  if (!existing) {
    return apiError("NOT_FOUND", "Patient not found.", 404);
  }

  const updated = await prisma.patient.update({
    where: { id },
    data: { isActive: false },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "DELETE",
      entityType: "Patient",
      entityId: updated.id,
      beforeJson: existing,
      afterJson: updated,
    },
  });

  return apiOk({ id: updated.id });
}
