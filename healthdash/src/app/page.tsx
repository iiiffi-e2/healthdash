import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-secondary/40">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Premium Practice OS
        </div>
        <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
          Modern practice management for teams who care about speed, clarity,
          and patient experience.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Healthdash brings scheduling, claims, billing, messaging, and
          analytics into one real-time workspace with a patient portal that
          feels effortless.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Button asChild size="lg">
            <Link href="/app/dashboard">Open staff workspace</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/portal">Open patient portal</Link>
          </Button>
        </div>
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Realtime scheduling",
              description:
                "Resource-aware calendars with conflict checks and live updates.",
            },
            {
              title: "Claims visibility",
              description:
                "Work queues, denial tracking, and KPI insights in one view.",
            },
            {
              title: "Patient experience",
              description:
                "Self-serve portal with appointments, records, and secure chat.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur"
            >
              <h3 className="text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
