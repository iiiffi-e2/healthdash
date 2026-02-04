import * as bcrypt from "bcryptjs";
import path from "node:path";
import { copyFile, mkdir, stat, writeFile } from "node:fs/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const names = [
  ["Avery", "Khan"],
  ["Jordan", "Lee"],
  ["Taylor", "Nguyen"],
  ["Riley", "Patel"],
  ["Morgan", "Diaz"],
  ["Quinn", "Chen"],
  ["Ari", "Garcia"],
  ["Reese", "Brooks"],
  ["Casey", "Holt"],
  ["Peyton", "Reed"],
  ["Sawyer", "Park"],
  ["Rowan", "Ross"],
  ["Emerson", "Stone"],
  ["Finley", "Miles"],
  ["Bailey", "Gray"],
  ["Dakota", "Hayes"],
  ["Skyler", "Ward"],
  ["Sydney", "Cruz"],
  ["Logan", "Pierce"],
  ["Harper", "Lane"],
  ["Jamie", "Foster"],
  ["Kendall", "Torres"],
  ["Marley", "Hughes"],
  ["Noel", "Bishop"],
  ["Alden", "Price"],
  ["Ellis", "Adams"],
  ["Tatum", "Lee"],
  ["Remy", "Santos"],
];

const providerColors = [
  "#0ea5a0",
  "#0ea5e9",
  "#22c55e",
  "#6366f1",
  "#14b8a6",
  "#38bdf8",
  "#10b981",
  "#8b5cf6",
  "#f97316",
  "#ec4899",
];

const providerSpecialties = [
  "General Dentistry",
  "Orthodontics",
  "Pediatric Dentistry",
  "Oral Surgery",
  "Endodontics",
  "Periodontics",
];

const locationCatalog = [
  {
    name: "Harbor Clinic",
    addressJson: {
      line1: "120 Market Street",
      city: "San Francisco",
      state: "CA",
      postalCode: "94101",
    },
  },
  {
    name: "Northpoint Dental",
    addressJson: {
      line1: "245 Mission Street",
      city: "San Francisco",
      state: "CA",
      postalCode: "94105",
    },
  },
  {
    name: "Bayview Wellness",
    addressJson: {
      line1: "380 Bayshore Blvd",
      city: "San Francisco",
      state: "CA",
      postalCode: "94124",
    },
  },
  {
    name: "Sunset Family Care",
    addressJson: {
      line1: "910 Irving Street",
      city: "San Francisco",
      state: "CA",
      postalCode: "94122",
    },
  },
];

const appointmentTypeCatalog = [
  { name: "Comprehensive Exam", duration: 60, color: "#0ea5a0" },
  { name: "Follow-up Visit", duration: 30, color: "#0ea5e9" },
  { name: "Hygiene Cleaning", duration: 45, color: "#14b8a6" },
  { name: "Consultation", duration: 40, color: "#22c55e" },
  { name: "Emergency Visit", duration: 25, color: "#f97316" },
];

function pick<T>(list: T[], index: number) {
  return list[index % list.length];
}

function randomPhone(seed: number) {
  return `555-${String(100 + seed).slice(-3)}-${String(1000 + seed * 37).slice(-4)}`;
}

function dateAt(base: Date, dayOffset: number, hour: number, minute = 0) {
  const date = new Date(base);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function addMinutes(date: Date, minutes: number) {
  const updated = new Date(date);
  updated.setMinutes(updated.getMinutes() + minutes);
  return updated;
}

function addDays(date: Date, days: number) {
  const updated = new Date(date);
  updated.setDate(updated.getDate() + days);
  return updated;
}

function seededPastDate(index: number, rangeDays: number) {
  const dayOffset = -((index * 7) % rangeDays) - 2;
  const hour = 9 + (index % 8);
  return dateAt(new Date(), dayOffset, hour, index % 2 === 0 ? 0 : 30);
}

async function ensureDemoUploadFile(storageKey: string) {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const source = path.join(process.cwd(), "public", "file.svg");
  const destination = path.join(uploadsDir, storageKey);

  try {
    await copyFile(source, destination);
  } catch (error) {
    await writeFile(
      destination,
      "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"80\"><rect width=\"120\" height=\"80\" fill=\"#e2e8f0\" /><text x=\"10\" y=\"45\" font-size=\"12\" fill=\"#0f172a\">Demo File</text></svg>",
    );
  }

  const stats = await stat(destination);
  return {
    storageKey,
    mimeType: "image/svg+xml",
    sizeBytes: stats.size,
  };
}

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Avery Admin",
      email: "admin@healthdash.dev",
      passwordHash,
      role: "ADMIN",
    },
  });

  const staffUsers = await Promise.all(
    [
      { name: "Jordan Front", email: "frontdesk1@healthdash.dev", role: "FRONT_DESK" },
      { name: "Taylor Front", email: "frontdesk2@healthdash.dev", role: "FRONT_DESK" },
      { name: "Morgan Billing", email: "billing@healthdash.dev", role: "BILLING" },
      { name: "Riley Nurse", email: "nurse@healthdash.dev", role: "NURSE" },
      { name: "Peyton Ops", email: "ops@healthdash.dev", role: "FRONT_DESK" },
    ].map((user) =>
      prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          passwordHash,
          role: user.role,
        },
      }),
    ),
  );

  const physicians = await Promise.all(
    Array.from({ length: 10 }).map((_, index) => {
      const [firstName, lastName] = names[index % names.length];
      return prisma.user.create({
        data: {
          name: `Dr. ${firstName} ${lastName}`,
          email: `physician${index + 1}@healthdash.dev`,
          passwordHash,
          role: "PHYSICIAN",
          providerProfile: {
            create: {
              specialty: pick(providerSpecialties, index),
              color: pick(providerColors, index),
              npi: `10020${index}888${index}`,
            },
          },
        },
      });
    }),
  );

  const locations = await Promise.all(
    locationCatalog.map((location) =>
      prisma.location.create({
        data: {
          name: location.name,
          timezone: "America/Los_Angeles",
          isActive: true,
          addressJson: location.addressJson,
        },
      }),
    ),
  );

  const appointmentTypes = await Promise.all(
    appointmentTypeCatalog.map((type) =>
      prisma.appointmentType.create({
        data: {
          name: type.name,
          defaultDurationMin: type.duration,
          color: type.color,
          bufferBeforeMin: 5,
          bufferAfterMin: 10,
        },
      }),
    ),
  );

  const patients = await Promise.all(
    Array.from({ length: 120 }).map((_, index) => {
      const [firstName, lastName] = pick(names, index + 3);
      const isActive = index % 17 !== 0;
      return prisma.patient.create({
        data: {
          firstName,
          lastName,
          dob: new Date(1978 + (index % 30), index % 12, (index % 27) + 1),
          email: `patient${index + 1}@healthdash.dev`,
          phone: randomPhone(index),
          isActive,
          portalUserId: index < 8 ? `portal-${index + 1}` : null,
          addressJson: {
            line1: `${210 + index} Pine Street`,
            city: "San Francisco",
            state: "CA",
            postalCode: `941${String(index % 10).padStart(2, "0")}`,
          },
          insuranceProfile:
            index % 3 === 0
              ? {
                  create: {
                    payerName: index % 2 === 0 ? "Delta Dental" : "Blue Shield",
                    memberId: `MEM-${1200 + index}`,
                    groupNumber: `GRP-${3200 + index}`,
                    planType: index % 2 === 0 ? "PPO" : "HMO",
                    notes: index % 4 === 0 ? "Requires pre-auth for specialty care." : null,
                  },
                }
              : undefined,
        },
      });
    }),
  );

  const today = new Date();
  const todayStart = dateAt(today, 0, 8, 0);

  await Promise.all(
    physicians.map((provider, index) =>
      prisma.staffSchedule.create({
        data: {
          userId: provider.id,
          startAt: dateAt(todayStart, 0, 8 + (index % 2)),
          endAt: dateAt(todayStart, 0, 16 + (index % 2)),
          type: "SHIFT",
          locationId: locations[index % locations.length].id,
          note: "Weekly rotation",
        },
      }),
    ),
  );

  await Promise.all(
    physicians.slice(0, 3).map((provider, index) =>
      prisma.staffSchedule.create({
        data: {
          userId: provider.id,
          startAt: dateAt(todayStart, 3 + index, 8, 0),
          endAt: dateAt(todayStart, 3 + index, 17, 0),
          type: "TIME_OFF",
          note: "Conference",
        },
      }),
    ),
  );

  const upcomingAppointments = await Promise.all(
    Array.from({ length: 36 }).map((_, index) => {
      const dayOffset = index % 8;
      const startAt = dateAt(todayStart, dayOffset, 9 + (index % 8));
      const appointmentType = pick(appointmentTypes, index);
      const endAt = addMinutes(startAt, appointmentType.defaultDurationMin);
      const status =
        dayOffset === 0 && index % 3 === 0
          ? "CHECKED_IN"
          : dayOffset === 0 && index % 3 === 1
            ? "IN_PROGRESS"
            : dayOffset <= 2
              ? "CONFIRMED"
              : "SCHEDULED";

      return prisma.appointment.create({
        data: {
          patientId: patients[index % patients.length].id,
          providerId: physicians[index % physicians.length].id,
          locationId: locations[index % locations.length].id,
          appointmentTypeId: appointmentType.id,
          startAt,
          endAt,
          status,
          reason: status === "SCHEDULED" ? "Routine appointment" : "Follow-up visit",
          createdByUserId: staffUsers[index % staffUsers.length].id,
        },
      });
    }),
  );

  const futureAppointments = await Promise.all(
    Array.from({ length: 22 }).map((_, index) => {
      const dayOffset = 10 + (index % 18);
      const startAt = dateAt(todayStart, dayOffset, 10 + (index % 6));
      const appointmentType = pick(appointmentTypes, index + 2);
      const endAt = addMinutes(startAt, appointmentType.defaultDurationMin);

      return prisma.appointment.create({
        data: {
          patientId: patients[(index + 12) % patients.length].id,
          providerId: physicians[(index + 4) % physicians.length].id,
          locationId: locations[(index + 1) % locations.length].id,
          appointmentTypeId: appointmentType.id,
          startAt,
          endAt,
          status: "SCHEDULED",
          reason: "Future check-in",
          createdByUserId: admin.id,
        },
      });
    }),
  );

  const pastAppointments = await Promise.all(
    Array.from({ length: 70 }).map((_, index) => {
      const startAt = seededPastDate(index, 300);
      const appointmentType = pick(appointmentTypes, index + 1);
      const endAt = addMinutes(startAt, appointmentType.defaultDurationMin);
      const status = index % 11 === 0 ? "NO_SHOW" : "COMPLETED";

      return prisma.appointment.create({
        data: {
          patientId: patients[(index + 18) % patients.length].id,
          providerId: physicians[(index + 2) % physicians.length].id,
          locationId: locations[index % locations.length].id,
          appointmentTypeId: appointmentType.id,
          startAt,
          endAt,
          status,
          reason: status === "NO_SHOW" ? "Missed appointment" : "Follow-up visit",
          createdByUserId: admin.id,
          updatedByUserId: admin.id,
        },
      });
    }),
  );

  const completedAppointments = pastAppointments.filter(
    (appointment) => appointment.status === "COMPLETED",
  );

  const encounters = await Promise.all(
    completedAppointments.slice(0, 24).map((appointment, index) =>
      prisma.encounter.create({
        data: {
          appointmentId: appointment.id,
          summary: index % 2 === 0 ? "Routine cleaning and check." : "Follow-up evaluation.",
          createdByUserId: physicians[index % physicians.length].id,
        },
      }),
    ),
  );

  const claimStatuses = ["PENDING", "APPROVED", "DENIED", "SUBMITTED", "RESUBMITTED"];

  const claims = await Promise.all(
    encounters.map((encounter, index) => {
      const status = pick(claimStatuses, index);
      const amountBilledCents = 18000 + index * 1200;
      const amountPaidCents = status === "APPROVED" ? amountBilledCents - 2500 : 0;
      const submittedAt = addDays(encounter.createdAt, -12 - index);
      const decidedAt =
        status === "APPROVED" || status === "DENIED"
          ? addDays(submittedAt, 7)
          : null;

      return prisma.claim.create({
        data: {
          patientId: completedAppointments[index].patientId,
          appointmentId: completedAppointments[index].id,
          encounterId: encounter.id,
          payerName: status === "DENIED" ? "Delta Dental" : "Blue Shield",
          amountBilledCents,
          amountPaidCents,
          status,
          submittedAt,
          decidedAt,
          denialReason: status === "DENIED" ? "Coverage not active" : null,
          createdByUserId: staffUsers[2].id,
          updatedByUserId: staffUsers[2].id,
          flagged: status === "PENDING" && index % 2 === 0,
        },
      });
    }),
  );

  await Promise.all(
    claims.map((claim, index) =>
      prisma.claimStatusHistory.create({
        data: {
          claimId: claim.id,
          fromStatus: claim.status === "SUBMITTED" ? "DRAFT" : "SUBMITTED",
          toStatus: claim.status,
          note: claim.status === "DENIED" ? "Needs follow-up" : "Processed",
          changedByUserId: staffUsers[2].id,
          changedAt: addDays(new Date(), -(12 - index)),
        },
      }),
    ),
  );

  const invoices = await Promise.all(
    completedAppointments.slice(0, 36).map((appointment, index) => {
      const totalAmountCents = 22000 + index * 850;
      const isPaid = index % 3 === 0;
      const balanceCents = isPaid ? 0 : index % 3 === 1 ? 7000 : 12000;
      const status = isPaid ? "PAID" : "OPEN";
      return prisma.invoice.create({
        data: {
          patientId: appointment.patientId,
          appointmentId: appointment.id,
          totalAmountCents,
          balanceCents,
          status,
          dueAt: addDays(appointment.startAt, 14),
        },
      });
    }),
  );

  await Promise.all(
    invoices.map((invoice, index) => {
      if (invoice.balanceCents === invoice.totalAmountCents) {
        return null;
      }
      const amountCents = invoice.balanceCents === 0 ? invoice.totalAmountCents : 5000;
      const postedAt = addDays(new Date(), -(index % 180));
      return prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amountCents,
          method: index % 2 === 0 ? "CARD" : "ACH",
          reference: `PAY-${invoice.id.slice(0, 6)}`,
          postedAt,
          createdByUserId: staffUsers[2].id,
        },
      });
    }),
  );

  const waitlistRequests = await Promise.all(
    Array.from({ length: 10 }).map((_, index) => {
      const appointmentType = pick(appointmentTypes, index);
      return prisma.waitlistRequest.create({
        data: {
          patientId: patients[(index + 40) % patients.length].id,
          appointmentTypeId: appointmentType.id,
          preferredStartAt: dateAt(todayStart, 5 + index, 9, 0),
          preferredEndAt: dateAt(todayStart, 8 + index, 17, 0),
          priority: 1 + (index % 3),
          status: pick(["OPEN", "CONTACTED", "BOOKED"], index),
          note: index % 2 === 0 ? "Prefer morning appointment." : "Flexible schedule.",
        },
      });
    }),
  );

  const documents = await Promise.all(
    Array.from({ length: 6 }).map(async (_, index) => {
      const fileMeta = await ensureDemoUploadFile(`demo-document-${index + 1}.svg`);
      return prisma.document.create({
        data: {
          patientId: patients[index].id,
          uploadedByUserId: staffUsers[0].id,
          title: `Treatment Plan ${index + 1}.svg`,
          type: "Treatment Plan",
          storageKey: fileMeta.storageKey,
          mimeType: fileMeta.mimeType,
          sizeBytes: fileMeta.sizeBytes,
        },
      });
    }),
  );

  await Promise.all(
    [
      {
        patientId: patients[0].id,
        subject: "Upcoming appointment details",
        messages: [
          {
            senderType: "PATIENT",
            senderPatientId: patients[0].id,
            body: "Can I arrive 10 minutes early for paperwork?",
          },
          {
            senderType: "STAFF",
            senderUserId: staffUsers[0].id,
            body: "Absolutely. We look forward to seeing you!",
          },
        ],
      },
      {
        patientId: patients[3].id,
        subject: "Insurance update",
        messages: [
          {
            senderType: "PATIENT",
            senderPatientId: patients[3].id,
            body: "I updated my insurance card. Do you need anything else?",
          },
          {
            senderType: "STAFF",
            senderUserId: staffUsers[2].id,
            body: "Thanks! Please upload the card when you have a moment.",
          },
        ],
      },
      {
        patientId: patients[5].id,
        subject: "Billing question",
        messages: [
          {
            senderType: "PATIENT",
            senderPatientId: patients[5].id,
            body: "Is there a payment plan option?",
          },
          {
            senderType: "STAFF",
            senderUserId: staffUsers[2].id,
            body: "Yes, we can set one up. I'll call you this afternoon.",
          },
        ],
      },
    ].map((thread) =>
      prisma.messageThread.create({
        data: {
          patientId: thread.patientId,
          subject: thread.subject,
          lastMessageAt: new Date(),
          messages: { create: thread.messages },
        },
      }),
    ),
  );

  await Promise.all(
    [
      {
        action: "CREATE",
        entityType: "Appointment",
        entityId: upcomingAppointments[0].id,
        afterJson: {
          status: upcomingAppointments[0].status,
          startAt: upcomingAppointments[0].startAt,
          providerId: upcomingAppointments[0].providerId,
        },
      },
      {
        action: "UPDATE",
        entityType: "Claim",
        entityId: claims[0].id,
        afterJson: { status: claims[0].status },
      },
      {
        action: "CREATE",
        entityType: "Document",
        entityId: documents[0].id,
        afterJson: { title: documents[0].title },
      },
      {
        action: "CREATE",
        entityType: "WaitlistRequest",
        entityId: waitlistRequests[0].id,
        afterJson: { status: waitlistRequests[0].status },
      },
    ].map((entry) =>
      prisma.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          afterJson: entry.afterJson,
          ip: "127.0.0.1",
        },
      }),
    ),
  );

  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
