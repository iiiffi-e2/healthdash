import {
  CalendarDays,
  ClipboardList,
  Home,
  FileText,
  Users,
  Stethoscope,
  Settings,
  ShieldCheck,
  BarChart3,
  Wallet,
  MessageCircle,
  HeartPulse,
  Mail,
} from "lucide-react";

export const staffNavigation = [
  { label: "Dashboard", href: "/app/dashboard", icon: Home },
  { label: "Schedule", href: "/app/schedule", icon: CalendarDays },
  { label: "Patients", href: "/app/patients", icon: Users },
  { label: "Claims", href: "/app/claims", icon: ClipboardList },
  { label: "Billing", href: "/app/billing", icon: Wallet },
  { label: "Staff", href: "/app/staff", icon: Stethoscope },
  { label: "Reports", href: "/app/reports", icon: BarChart3 },
  { label: "Audit Log", href: "/app/audit", icon: ShieldCheck },
  { label: "Settings", href: "/app/settings", icon: Settings },
];

export const portalNavigation = [
  { label: "Overview", href: "/portal", icon: HeartPulse },
  { label: "Appointments", href: "/portal/appointments", icon: CalendarDays },
  { label: "Records", href: "/portal/records", icon: FileText },
  { label: "Billing", href: "/portal/billing", icon: Wallet },
  { label: "Messages", href: "/portal/messages", icon: Mail },
];

export const quickAddItems = [
  { label: "New patient", href: "/app/patients?new=true" },
  { label: "New appointment", href: "/app/schedule?new=true" },
  { label: "New claim", href: "/app/claims?new=true" },
  { label: "Record payment", href: "/app/billing?new=true" },
];

export const commandPaletteItems = [
  { label: "Dashboard", href: "/app/dashboard" },
  { label: "Schedule", href: "/app/schedule" },
  { label: "Patients", href: "/app/patients" },
  { label: "Claims", href: "/app/claims" },
  { label: "Billing", href: "/app/billing" },
  { label: "Reports", href: "/app/reports" },
  { label: "Audit Log", href: "/app/audit" },
  { label: "Settings", href: "/app/settings" },
  { label: "Portal", href: "/portal" },
];
