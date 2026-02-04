import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, Permissions, type Permission } from "@/lib/rbac";
import type { UserRole } from "@/generated/prisma/client";

export function apiOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
) {
  return NextResponse.json(
    { ok: false, error: { code, message, details } },
    { status },
  );
}

export async function requireApiUser(permission?: Permission) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    if (process.env.DEMO_MODE === "true") {
      const demoUser = await prisma.user.upsert({
        where: { email: "demo@healthdash.dev" },
        update: {
          name: "Demo User",
          role: "ADMIN",
          isActive: true,
        },
        create: {
          id: "demo",
          name: "Demo User",
          email: "demo@healthdash.dev",
          passwordHash: "demo",
          role: "ADMIN",
          isActive: true,
        },
      });
      return {
        user: {
          id: demoUser.id,
          name: demoUser.name,
          email: demoUser.email,
          role: demoUser.role,
          permissions: Object.values(Permissions),
        },
      };
    }

    return { error: apiError("UNAUTHORIZED", "Authentication required.", 401) };
  }

  if (
    permission &&
    !hasPermission(session.user.role as unknown as UserRole, permission)
  ) {
    return { error: apiError("FORBIDDEN", "Insufficient permissions.", 403) };
  }

  return { user: session.user };
}
