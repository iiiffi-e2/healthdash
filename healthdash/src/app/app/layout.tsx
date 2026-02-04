import { AppShell } from "@/components/layouts/app-shell";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell title="Healthdash" navigationVariant="staff">
      {children}
    </AppShell>
  );
}
