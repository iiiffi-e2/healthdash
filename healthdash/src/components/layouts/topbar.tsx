"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { CommandPalette } from "@/components/navigation/command-palette";
import { MobileNav } from "@/components/layouts/mobile-nav";
import { quickAddItems } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, Moon, Sun } from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function Topbar({
  navigation,
  title = "Healthdash",
}: {
  navigation?: NavItem[];
  title?: string;
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        {navigation ? <MobileNav navigation={navigation} title={title} /> : null}
        <div className="relative hidden w-72 lg:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Global search"
            placeholder="Search patients, appointments, claims..."
            className="pl-9"
          />
        </div>
        <CommandPalette />
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Quick add
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {quickAddItems.map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link href={item.href}>{item.label}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={() =>
            setTheme(theme === "dark" ? "light" : "dark")
          }
        >
          {mounted && theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-2 py-1 text-xs">
          <span className="h-6 w-6 rounded-full bg-primary/20 text-center leading-6 text-primary">
            SA
          </span>
          <span className="hidden text-sm font-medium md:inline">Staff Admin</span>
        </div>
      </div>
    </header>
  );
}
