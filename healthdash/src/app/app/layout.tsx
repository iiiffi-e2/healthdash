import { AppShell } from "@/components/layouts/app-shell";
import { staffNavigation } from "@/lib/navigation";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell title="Healthdash" navigation={staffNavigation}>
      {children}
    </AppShell>
  );
}
