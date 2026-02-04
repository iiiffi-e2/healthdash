import { Sidebar } from "@/components/layouts/sidebar";
import { Topbar } from "@/components/layouts/topbar";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function AppShell({
  title,
  navigation,
  children,
  topbar,
}: {
  title: string;
  navigation: NavItem[];
  children: React.ReactNode;
  topbar?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar navigation={navigation} title={title} />
      <div className="flex flex-1 flex-col">
        {topbar ?? <Topbar navigation={navigation} title={title} />}
        <main className="flex-1 bg-gradient-to-br from-background via-background to-secondary/20 px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
