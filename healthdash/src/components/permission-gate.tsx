"use client";

import { useSession } from "next-auth/react";
import { hasPermission, type Permission } from "@/lib/rbac";
import type { UserRole } from "@/generated/prisma";

export function PermissionGate({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { data } = useSession();
  const role = data?.user?.role;

  if (!role) {
    return fallback;
  }

  return hasPermission(role as unknown as UserRole, permission)
    ? children
    : fallback;
}
