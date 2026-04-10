import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { validateProjectFilePath } from "../../../src/lib/project-files";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

type HandlerEvent = {
  arguments: {
    path: string;
    projectId: string;
  };
};

export const handler = async (event: HandlerEvent) => {
  const { path, projectId } = event.arguments;
  const bucketName = process.env.PROJECT_FILES_BUCKET_NAME;

  if (!bucketName) {
    throw new Error("Storage bucket is not configured.");
  }

  if (!validateProjectFilePath(path, { projectId })) {
    throw new Error("Invalid file path.");
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: path,
  });

  const expiresIn = 60 * 15;
  const url = await getSignedUrl(s3Client, command, { expiresIn });

  return {
    path,
    url,
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
  };
};
