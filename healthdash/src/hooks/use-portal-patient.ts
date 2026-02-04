"use client";

import { useQuery } from "@tanstack/react-query";

type PortalPatient = {
  id: string;
  name: string;
  email?: string | null;
};

async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(payload.error?.message ?? "Request failed");
  }
  return payload.data;
}

export function usePortalPatient() {
  const query = useQuery({
    queryKey: ["portal-patient"],
    queryFn: () => fetcher<PortalPatient[]>("/api/patients?query=&page=1"),
  });

  return {
    ...query,
    patient: query.data?.[0],
  };
}
