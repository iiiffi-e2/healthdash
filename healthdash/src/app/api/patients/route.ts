import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError, apiOk, requireApiUser } from "@/lib/api";
import { Permissions } from "@/lib/rbac";

const querySchema = z.object({
  query: z.string().optional().default(""),
  page: z.coerce.number().optional().default(1),
});

const patientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dob: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  addressJson: z.record(z.any()).optional(),
});

export async function GET(request: Request) {
  const { error } = await requireApiUser(Permissions.MANAGE_PATIENTS);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    query: searchParams.get("query") ?? "",
    page: searchParams.get("page") ?? "1",
  });
  if (!parsed.success) {
    return apiError("INVALID_QUERY", "Invalid query parameters.", 400, parsed.error);
  }

  const pageSize = 20;
  const skip = (parsed.data.page - 1) * pageSize;
  const query = parsed.data.query.trim();

  const patients = await prisma.patient.findMany({
    where: {
      isActive: true,
      OR: query
        ? [
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ]
        : undefined,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: pageSize,
    skip,
  });

  return apiOk(
    patients.map((patient) => ({
      id: patient.id,
      name: `${patient.firstName} ${patient.lastName}`,
      dob: patient.dob.toLocaleDateString(),
      email: patient.email,
      phone: patient.phone,
      status: patient.isActive ? "ACTIVE" : "INACTIVE",
    })),
  );
}

export async function POST(request: Request) {
  const { error, user } = await requireApiUser(Permissions.MANAGE_PATIENTS);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = patientSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Invalid patient payload.", 400, parsed.error);
  }

  const patient = await prisma.patient.create({
    data: {
      ...parsed.data,
      dob: new Date(parsed.data.dob),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "CREATE",
      entityType: "Patient",
      entityId: patient.id,
      afterJson: patient,
    },
  });

  return apiOk(patient);
}
