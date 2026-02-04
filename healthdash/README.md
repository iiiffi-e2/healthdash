# Healthdash Practice OS

Full-featured practice management system with a staff/admin workspace and patient portal. Built with Next.js App Router, Prisma, and a premium SaaS UI layer.

## Features

- Realtime dashboard with appointments, claims, and revenue metrics
- Multi-provider scheduling with conflict detection and drag/drop rescheduling
- Patient management with summaries, documents, and messaging
- Claims work queue, KPIs, and timeline history
- Billing with invoices, payments, and portal balance visibility
- RBAC enforcement + audit logs for all critical changes
- Patient portal for appointments, records, billing, and messaging

## Tech Stack

- Next.js (App Router) + TypeScript + TailwindCSS
- shadcn/ui + lucide-react
- TanStack Query + react-hook-form + zod
- FullCalendar (resource time grid)
- Recharts
- Prisma + PostgreSQL
- NextAuth (Credentials)
- SSE realtime channel (EventSource)
- Playwright + Vitest

## Local setup

1. **Install dependencies**

```bash
npm install
```

2. **Configure environment**

Copy `.env.example` to `.env` and update values.

```bash
cp .env.example .env
```

3. **Generate Prisma client + migrate**

```bash
npm run prisma:generate
npm run db:push
npm run db:seed
```

4. **Start the app**

```bash
npm run dev
```

Open:
- Staff app: http://localhost:3000/app/dashboard
- Patient portal: http://localhost:3000/portal

## Demo credentials

Use the seeded credentials:

- Admin: `admin@healthdash.dev` / `Password123!`
- Front desk: `frontdesk1@healthdash.dev` / `Password123!`
- Billing: `billing@healthdash.dev` / `Password123!`

## Environment variables

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/healthdash
NEXTAUTH_SECRET=replace-me
NEXTAUTH_URL=http://localhost:3000
DEMO_MODE=true
```

## Testing

```bash
npm run test
npm run test:e2e
```

## Notes

- Uploads are stored locally under `public/uploads` in dev.
- Realtime events are delivered via server-sent events (`/api/realtime`).
