import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { list } from "aws-amplify/storage/server";

import { DashboardInteractive } from "@/components/dashboard-interactive";
import {
  cookiesClient,
  getCurrentUserOrNull,
  runWithAmplifyServerContext,
} from "@/lib/server/amplify-server-utils";
import { getProjectFilesPrefix } from "@/lib/project-files";
import { resolveSelectedProjectId } from "@/lib/selected-project";

type StoredFile = {
  path: string;
  size?: number;
  lastModified?: string | null;
};

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

async function loadDashboardData(requestedProjectId?: string) {
  const user = await getCurrentUserOrNull();

  if (!user) {
    redirect("/login");
  }

  const [{ data: projects, errors: projectErrors }, { data: tasks, errors: taskErrors }] =
    await Promise.all([
      cookiesClient.models.Project.list(),
      cookiesClient.models.Task.list(),
    ]);

  presentErrors(projectErrors);
  presentErrors(taskErrors);

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

  const serializableProjects = sortedProjects.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description ?? null,
    tone: project.tone ?? null,
    createdAt: project.createdAt ?? null,
    updatedAt: project.updatedAt ?? null,
  }));

  const serializableTasks = sortedTasks.map((task) => ({
    id: task.id,
    title: task.title,
    note: task.note ?? null,
    done: task.done,
    projectId: task.projectId,
    createdAt: task.createdAt ?? null,
    updatedAt: task.updatedAt ?? null,
  }));

  let projectFiles: StoredFile[] = [];

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
    projects: serializableProjects,
    tasks: serializableTasks,
    selectedProjectId,
    projectFiles,
  };
}

export async function Dashboard({
  requestedProjectId,
}: {
  requestedProjectId?: string;
}) {
  const data = await loadDashboardData(requestedProjectId);

  return <DashboardInteractive {...data} />;
}
