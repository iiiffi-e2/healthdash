"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function Sidebar({
  navigation,
  title,
}: {
  navigation: NavItem[];
  title: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-64 flex-col border-r border-border/60 bg-sidebar px-4 py-6 lg:flex">
      <div className="flex items-center gap-2 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <span className="text-lg font-semibold">H</span>
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">Practice OS</p>
        </div>
      </div>
      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {navigation.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4 text-primary/80 group-hover:text-primary" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="rounded-2xl border border-sidebar-border/60 bg-sidebar-accent/40 p-4 text-xs text-muted-foreground">
        <p className="font-semibold text-sidebar-foreground">Today</p>
        <p className="mt-1">
          5 appointments scheduled · 3 claims awaiting review
        </p>
      </div>
    </aside>
  );
}
