import { AppShell } from "@/components/layouts/app-shell";
import { PortalTopbar } from "@/components/layouts/portal-topbar";
import { portalNavigation } from "@/lib/navigation";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell
      title="Healthdash Portal"
      navigation={portalNavigation}
      topbar={<PortalTopbar />}
    >
      {children}
    </AppShell>
  );
}
