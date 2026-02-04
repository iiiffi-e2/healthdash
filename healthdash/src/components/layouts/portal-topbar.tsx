"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Search, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileNav } from "@/components/layouts/mobile-nav";
import { portalNavigation } from "@/lib/navigation";

export function PortalTopbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <MobileNav navigation={portalNavigation} title="Healthdash Portal" />
        <div className="relative hidden w-72 lg:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search your care"
          placeholder="Search records, messages..."
          className="pl-9"
        />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild size="sm">
          <Link href="/portal/request-appointment">Request visit</Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {mounted && theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-2 py-1 text-xs">
          <span className="h-6 w-6 rounded-full bg-primary/20 text-center leading-6 text-primary">
            PK
          </span>
          <span className="hidden text-sm font-medium md:inline">Portal User</span>
        </div>
      </div>
    </header>
  );
}
