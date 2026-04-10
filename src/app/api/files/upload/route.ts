import { uploadProjectFile } from "@/features/workspace/server/project-file-routes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return uploadProjectFile(request);
}
