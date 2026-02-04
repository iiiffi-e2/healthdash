"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function MobileNav({
  navigation,
  title,
}: {
  navigation: NavItem[];
  title: string;
}) {
  return (
    <Sheet>
      <SheetTrigger className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1 text-xs lg:hidden">
        <Menu className="h-4 w-4" />
        Menu
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <div className="flex items-center gap-2 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <span className="text-sm font-semibold">H</span>
          </div>
          <div>
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground">Practice OS</p>
          </div>
        </div>
        <nav className="mt-6 flex flex-col gap-2">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              <item.icon className="h-4 w-4 text-primary" />
              {item.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
