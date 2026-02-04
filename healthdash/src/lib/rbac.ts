import { UserRole } from "@/generated/prisma/client";

export const Permissions = {
  VIEW_DASHBOARD: "VIEW_DASHBOARD",
  MANAGE_PATIENTS: "MANAGE_PATIENTS",
  MANAGE_APPOINTMENTS: "MANAGE_APPOINTMENTS",
  APPOINTMENT_OVERRIDE: "APPOINTMENT_OVERRIDE",
  MANAGE_CLAIMS: "MANAGE_CLAIMS",
  MANAGE_BILLING: "MANAGE_BILLING",
  MANAGE_STAFF: "MANAGE_STAFF",
  VIEW_REPORTS: "VIEW_REPORTS",
  VIEW_AUDIT: "VIEW_AUDIT",
  MANAGE_SETTINGS: "MANAGE_SETTINGS",
  MANAGE_SCHEDULES: "MANAGE_SCHEDULES",
  MANAGE_MESSAGES: "MANAGE_MESSAGES",
  MANAGE_DOCUMENTS: "MANAGE_DOCUMENTS",
  VIEW_PORTAL: "VIEW_PORTAL",
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

const rolePermissions: Record<UserRole, Permission[] | "*"> = {
  ADMIN: "*",
  PHYSICIAN: [
    Permissions.VIEW_DASHBOARD,
    Permissions.MANAGE_APPOINTMENTS,
    Permissions.MANAGE_PATIENTS,
    Permissions.MANAGE_DOCUMENTS,
    Permissions.MANAGE_MESSAGES,
    Permissions.VIEW_REPORTS,
  ],
  NURSE: [
    Permissions.VIEW_DASHBOARD,
    Permissions.MANAGE_APPOINTMENTS,
    Permissions.MANAGE_PATIENTS,
    Permissions.MANAGE_DOCUMENTS,
    Permissions.MANAGE_MESSAGES,
  ],
  FRONT_DESK: [
    Permissions.VIEW_DASHBOARD,
    Permissions.MANAGE_APPOINTMENTS,
    Permissions.MANAGE_PATIENTS,
    Permissions.MANAGE_MESSAGES,
    Permissions.MANAGE_SCHEDULES,
  ],
  BILLING: [
    Permissions.VIEW_DASHBOARD,
    Permissions.MANAGE_BILLING,
    Permissions.MANAGE_CLAIMS,
    Permissions.VIEW_REPORTS,
  ],
};

export function getPermissionsForRole(role: UserRole): Permission[] {
  const value = rolePermissions[role];
  if (value === "*") {
    return Object.values(Permissions);
  }
  return value;
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const value = rolePermissions[role];
  if (value === "*") {
    return true;
  }
  return value.includes(permission);
}
