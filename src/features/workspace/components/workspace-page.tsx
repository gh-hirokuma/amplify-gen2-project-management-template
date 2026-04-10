import { loadWorkspaceData } from "@/features/workspace/server/load-workspace-data";
import { WorkspaceInteractive } from "@/features/workspace/components/workspace-interactive";

export async function WorkspacePage({
  requestedProjectId,
}: {
  requestedProjectId?: string;
}) {
  const data = await loadWorkspaceData(requestedProjectId);

  return <WorkspaceInteractive {...data} />;
}
