export function resolveSelectedProjectId(projectIds: string[], requestedProjectId?: string | null) {
  if (requestedProjectId && projectIds.includes(requestedProjectId)) {
    return requestedProjectId;
  }

  return projectIds[0] ?? null;
}
