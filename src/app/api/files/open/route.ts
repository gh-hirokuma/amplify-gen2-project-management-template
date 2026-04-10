import { NextRequest } from "next/server";

import { openProjectFile } from "@/features/workspace/server/project-file-routes";

export async function GET(request: NextRequest) {
  return openProjectFile(request);
}
