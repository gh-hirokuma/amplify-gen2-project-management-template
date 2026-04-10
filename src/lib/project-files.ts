const PROJECT_FILES_PREFIX = "project-files";

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w.\- ]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/_+/g, "-")
    .toLowerCase();
}

export function sanitizeFileName(fileName: string) {
  const cleaned = slugify(fileName.replaceAll("/", " ").replaceAll("\\", " ").replaceAll("..", " "));

  return cleaned || "file";
}

export function buildProjectFilePath({
  projectId,
  fileName,
  timestamp = new Date().toISOString(),
}: {
  projectId: string;
  fileName: string;
  timestamp?: string;
}) {
  const safeTimestamp = timestamp.replaceAll(":", "-").replaceAll(".", "-");
  const safeFileName = sanitizeFileName(fileName);

  return `${PROJECT_FILES_PREFIX}/${projectId}/${safeTimestamp}-${safeFileName}`;
}

export function getProjectFilesPrefix(projectId: string) {
  return `${PROJECT_FILES_PREFIX}/${projectId}/`;
}

export function validateProjectFilePath(path: string, { projectId }: { projectId: string }) {
  if (!path || path.includes("..")) {
    return false;
  }

  return path.startsWith(getProjectFilesPrefix(projectId));
}

export function getDisplayFileName(path: string) {
  const rawName = path.split("/").pop() ?? path;
  return rawName.replace(/^\d{4}-\d{2}-\d{2}T[\d-]+Z-/, "");
}
