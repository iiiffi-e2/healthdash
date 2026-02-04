import { apiOk } from "@/lib/api";

export async function POST() {
  return apiOk({ message: "Logged out" });
}
