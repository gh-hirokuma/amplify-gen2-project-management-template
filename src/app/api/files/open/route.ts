import { NextRequest, NextResponse } from "next/server";

import { cookiesClient, getCurrentUserOrNull } from "@/lib/server/amplify-server-utils";

function presentErrors(errors: unknown) {
  if (!Array.isArray(errors) || errors.length === 0) {
    return;
  }

  const message = errors
    .map((entry) =>
      typeof entry === "object" && entry !== null && "message" in entry
        ? String(entry.message)
        : "Unknown data error",
    )
    .join(", ");

  throw new Error(message);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserOrNull();

    if (!user) {
      return NextResponse.json({ error: "Unauthenticated request." }, { status: 401 });
    }

    const projectId = request.nextUrl.searchParams.get("projectId");
    const path = request.nextUrl.searchParams.get("path");

    if (!projectId || !path) {
      return NextResponse.json({ error: "Missing projectId or path." }, { status: 400 });
    }

    const { data, errors } = await cookiesClient.queries.getSignedProjectFileUrl({
      projectId,
      path,
    });

    presentErrors(errors);

    if (!data?.url) {
      return NextResponse.json({ error: "Signed URL not available." }, { status: 500 });
    }

    return NextResponse.redirect(data.url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to open file.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
