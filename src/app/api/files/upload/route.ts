import { NextResponse } from "next/server";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import outputs from "../../../../../amplify_outputs.json";
import { buildProjectFilePath } from "@/lib/project-files";
import { cookiesClient, getCurrentUserOrNull } from "@/lib/server/amplify-server-utils";

export const runtime = "nodejs";

const s3Client = new S3Client({
  region: outputs.storage.aws_region,
});

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

function isFileLike(value: FormDataEntryValue | null): value is File {
  return (
    (typeof File !== "undefined" && value instanceof File) ||
    (!!value &&
      typeof value === "object" &&
      "name" in value &&
      "size" in value &&
      "arrayBuffer" in value)
  );
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserOrNull();

    if (!user) {
      return NextResponse.json({ error: "Unauthenticated request." }, { status: 401 });
    }

    const formData = await request.formData();
    const projectId = formData.get("projectId");
    const file = formData.get("file");

    if (typeof projectId !== "string" || projectId.trim().length === 0) {
      return NextResponse.json({ error: "Missing projectId." }, { status: 400 });
    }

    if (!isFileLike(file) || file.size === 0) {
      return NextResponse.json({ error: "Select a file before uploading." }, { status: 400 });
    }

    const { data, errors } = await cookiesClient.models.Project.get({ id: projectId });
    presentErrors(errors);

    if (!data) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const path = buildProjectFilePath({
      projectId,
      fileName: file.name,
    });

    await s3Client.send(
      new PutObjectCommand({
        Bucket: outputs.storage.bucket_name,
        Key: path,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: file.type || "application/octet-stream",
      }),
    );

    return NextResponse.json({ path });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to upload file.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
