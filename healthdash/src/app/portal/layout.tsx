import { AppShell } from "@/components/layouts/app-shell";
import { PortalTopbar } from "@/components/layouts/portal-topbar";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell
      title="Healthdash Portal"
      navigationVariant="portal"
      topbar={<PortalTopbar />}
    >
      {children}
    </AppShell>
  );
}
