import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { list } from "aws-amplify/storage/server";

import { getProjectFilesPrefix } from "@/lib/project-files";
import { resolveSelectedProjectId } from "@/lib/selected-project";
import { throwIfAmplifyErrors } from "@/server/amplify-errors";
import {
  cookiesClient,
  getCurrentUserOrNull,
  runWithAmplifyServerContext,
} from "@/server/amplify";
import type { WorkspacePageData } from "@/features/workspace/types";

export async function loadWorkspaceData(
  requestedProjectId?: string,
): Promise<WorkspacePageData> {
  const user = await getCurrentUserOrNull();

  if (!user) {
    redirect("/login");
  }

  const [{ data: projects, errors: projectErrors }, { data: tasks, errors: taskErrors }] =
    await Promise.all([
      cookiesClient.models.Project.list(),
      cookiesClient.models.Task.list(),
    ]);

  throwIfAmplifyErrors(projectErrors);
  throwIfAmplifyErrors(taskErrors);

  const sortedProjects = [...(projects ?? [])].sort((a, b) =>
    a.createdAt && b.createdAt
      ? a.createdAt.localeCompare(b.createdAt)
      : a.name.localeCompare(b.name),
  );

  const sortedTasks = [...(tasks ?? [])].sort((a, b) =>
    a.createdAt && b.createdAt
      ? a.createdAt.localeCompare(b.createdAt)
      : a.title.localeCompare(b.title),
  );

  const selectedProjectId = resolveSelectedProjectId(
    sortedProjects.map((project) => project.id),
    requestedProjectId,
  );

  let projectFiles: WorkspacePageData["projectFiles"] = [];

  if (selectedProjectId) {
    const listed = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) =>
        list(contextSpec, {
          path: getProjectFilesPrefix(selectedProjectId),
          options: { pageSize: 100 },
        }),
    });

    projectFiles = [...listed.items]
      .sort((a, b) => {
        const left = a.lastModified?.getTime() ?? 0;
        const right = b.lastModified?.getTime() ?? 0;
        return right - left;
      })
      .map((item) => ({
        path: item.path,
        size: item.size,
        lastModified: item.lastModified?.toISOString() ?? null,
      }));
  }

  return {
    user: {
      username: user.username,
      loginId: user.signInDetails?.loginId ?? user.username,
    },
    projects: sortedProjects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description ?? null,
      tone: project.tone ?? null,
      createdAt: project.createdAt ?? null,
      updatedAt: project.updatedAt ?? null,
    })),
    tasks: sortedTasks.map((task) => ({
      id: task.id,
      title: task.title,
      note: task.note ?? null,
      done: task.done,
      projectId: task.projectId,
      createdAt: task.createdAt ?? null,
      updatedAt: task.updatedAt ?? null,
    })),
    selectedProjectId,
    projectFiles,
  };
}
