import { debugCurrentSession } from "@/features/auth/server/session-debug";

export async function GET() {
  return debugCurrentSession();
}
