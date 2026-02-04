const bcrypt = require("bcryptjs");
const { PrismaClient } = require("../src/generated/prisma");

const prisma = new PrismaClient();

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
];

function randomPhone(seed) {
  return `555-${String(100 + seed).slice(-3)}-${String(1000 + seed * 37).slice(-4)}`;
}

function randomDateInPast(daysBack) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  date.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0);
  return date;
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
    Array.from({ length: 8 }).map((_, index) => {
      const [firstName, lastName] = names[index % names.length];
      return prisma.user.create({
        data: {
          name: `Dr. ${firstName} ${lastName}`,
          email: `physician${index + 1}@healthdash.dev`,
          passwordHash,
          role: "PHYSICIAN",
          providerProfile: {
            create: {
              specialty: index % 2 === 0 ? "General Dentistry" : "Orthodontics",
              color: providerColors[index % providerColors.length],
              npi: `10020${index}888${index}`,
            },
          },
        },
      });
    }),
  );

  const locations = await Promise.all(
    ["Harbor Clinic", "Northpoint Dental"].map((name, index) =>
      prisma.location.create({
        data: {
          name,
          timezone: "America/Los_Angeles",
          isActive: true,
          addressJson: {
            line1: `${120 + index} Market Street`,
            city: "San Francisco",
            state: "CA",
            postalCode: "9410" + index,
          },
        },
      }),
    ),
  );

  const appointmentTypes = await Promise.all(
    [
      { name: "Comprehensive Exam", duration: 60, color: "#0ea5a0" },
      { name: "Follow-up Visit", duration: 30, color: "#0ea5e9" },
      { name: "Hygiene Cleaning", duration: 45, color: "#14b8a6" },
    ].map((type) =>
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
    Array.from({ length: 50 }).map((_, index) => {
      const [firstName, lastName] = names[(index + 3) % names.length];
      return prisma.patient.create({
        data: {
          firstName,
          lastName,
          dob: new Date(1984 + (index % 25), index % 12, (index % 27) + 1),
          email: `patient${index + 1}@healthdash.dev`,
          phone: randomPhone(index),
          addressJson: {
            line1: `${200 + index} Pine Street`,
            city: "San Francisco",
            state: "CA",
            postalCode: "9410" + (index % 9),
          },
          insuranceProfile: index % 2 === 0
            ? {
                create: {
                  payerName: index % 3 === 0 ? "Delta Dental" : "Blue Shield",
                  memberId: `MEM-${1000 + index}`,
                  groupNumber: `GRP-${2000 + index}`,
                  planType: "PPO",
                },
              }
            : undefined,
        },
      });
    }),
  );

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0);
  const todayAppointments = await Promise.all(
    Array.from({ length: 5 }).map((_, index) => {
      const startAt = new Date(todayStart);
      startAt.setHours(9 + index);
      const duration = appointmentTypes[index % appointmentTypes.length].defaultDurationMin;
      const endAt = new Date(startAt);
      endAt.setMinutes(endAt.getMinutes() + duration);

      return prisma.appointment.create({
        data: {
          patientId: patients[index].id,
          providerId: physicians[index % physicians.length].id,
          locationId: locations[index % locations.length].id,
          appointmentTypeId: appointmentTypes[index % appointmentTypes.length].id,
          startAt,
          endAt,
          status: index < 2 ? "CONFIRMED" : "SCHEDULED",
          reason: "Routine appointment",
          createdByUserId: admin.id,
        },
      });
    }),
  );

  const pastAppointments = await Promise.all(
    Array.from({ length: 20 }).map((_, index) => {
      const startAt = randomDateInPast(330);
      const duration = appointmentTypes[index % appointmentTypes.length].defaultDurationMin;
      const endAt = new Date(startAt);
      endAt.setMinutes(endAt.getMinutes() + duration);

      return prisma.appointment.create({
        data: {
          patientId: patients[(index + 5) % patients.length].id,
          providerId: physicians[(index + 2) % physicians.length].id,
          locationId: locations[index % locations.length].id,
          appointmentTypeId: appointmentTypes[index % appointmentTypes.length].id,
          startAt,
          endAt,
          status: index % 6 === 0 ? "NO_SHOW" : "COMPLETED",
          reason: "Follow-up visit",
          createdByUserId: admin.id,
          updatedByUserId: admin.id,
        },
      });
    }),
  );

  const invoices = await Promise.all(
    todayAppointments.map((appointment, index) =>
      prisma.invoice.create({
        data: {
          patientId: appointment.patientId,
          appointmentId: appointment.id,
          totalAmountCents: 25000 + index * 2500,
          balanceCents: 0,
          status: "PAID",
          dueAt: new Date(),
        },
      }),
    ),
  );

  await Promise.all(
    invoices.map((invoice) =>
      prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amountCents: invoice.totalAmountCents,
          method: "CARD",
          reference: `PAY-${invoice.id.slice(0, 6)}`,
          postedAt: new Date(),
          createdByUserId: staffUsers[2].id,
        },
      }),
    ),
  );

  const pendingClaims = await Promise.all(
    [
      { amount: 25000, daysAgo: 40 },
      { amount: 20000, daysAgo: 35 },
      { amount: 27500, daysAgo: 32 },
    ].map((claim, index) =>
      prisma.claim.create({
        data: {
          patientId: patients[index].id,
          appointmentId: pastAppointments[index].id,
          payerName: "Delta Dental",
          amountBilledCents: claim.amount,
          amountPaidCents: 0,
          status: "PENDING",
          submittedAt: new Date(Date.now() - claim.daysAgo * 24 * 60 * 60 * 1000),
          createdByUserId: staffUsers[2].id,
          updatedByUserId: staffUsers[2].id,
          flagged: claim.daysAgo > 30,
        },
      }),
    ),
  );

  const approvedClaims = await Promise.all(
    Array.from({ length: 3 }).map((_, index) =>
      prisma.claim.create({
        data: {
          patientId: patients[index + 10].id,
          appointmentId: pastAppointments[index + 4].id,
          payerName: "Blue Shield",
          amountBilledCents: 15000 + index * 5000,
          amountPaidCents: 12000 + index * 4000,
          status: "APPROVED",
          submittedAt: new Date(Date.now() - (20 + index * 3) * 24 * 60 * 60 * 1000),
          decidedAt: new Date(Date.now() - (5 + index) * 24 * 60 * 60 * 1000),
          createdByUserId: staffUsers[2].id,
          updatedByUserId: staffUsers[2].id,
        },
      }),
    ),
  );

  const deniedClaims = await Promise.all(
    Array.from({ length: 4 }).map((_, index) =>
      prisma.claim.create({
        data: {
          patientId: patients[index + 20].id,
          appointmentId: pastAppointments[index + 8].id,
          payerName: "Delta Dental",
          amountBilledCents: 18000 + index * 3000,
          amountPaidCents: 0,
          status: "DENIED",
          submittedAt: new Date(Date.now() - (60 + index * 4) * 24 * 60 * 60 * 1000),
          decidedAt: new Date(Date.now() - (30 + index * 2) * 24 * 60 * 60 * 1000),
          denialReason: index === 0 ? "Missing documentation" : "Coverage not active",
          flagged: index === 0,
          createdByUserId: staffUsers[2].id,
          updatedByUserId: staffUsers[2].id,
        },
      }),
    ),
  );

  await Promise.all(
    [...pendingClaims, ...approvedClaims, ...deniedClaims].map((claim) =>
      prisma.claimStatusHistory.create({
        data: {
          claimId: claim.id,
          fromStatus: "SUBMITTED",
          toStatus: claim.status,
          note: claim.status === "DENIED" ? "Needs follow-up" : "Processed",
          changedByUserId: staffUsers[2].id,
          changedAt: new Date(claim.updatedAt),
        },
      }),
    ),
  );

  await prisma.messageThread.create({
    data: {
      patientId: patients[0].id,
      subject: "Upcoming appointment details",
      lastMessageAt: new Date(),
      messages: {
        create: [
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
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: "CREATE",
      entityType: "Appointment",
      entityId: todayAppointments[0].id,
      afterJson: {
        status: "CONFIRMED",
        startAt: todayAppointments[0].startAt,
        providerId: todayAppointments[0].providerId,
      },
      ip: "127.0.0.1",
    },
  });

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
