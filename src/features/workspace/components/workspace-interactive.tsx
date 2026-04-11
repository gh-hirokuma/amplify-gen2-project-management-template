"use client";

import type { FormEvent } from "react";
import { useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  archiveProjectAction,
  createProjectAction,
  createTaskAction,
  deleteTaskAction,
  getProjectFileUrlAction,
  reorderProjectsAction,
  reorderTasksAction,
  toggleTaskAction,
  updateProjectAction,
  updateTaskAction,
  uploadProjectFileAction,
} from "@/features/workspace/server/workspace-actions";
import { ProjectFilesPanel } from "@/features/workspace/components/project-files-panel";
import { ProjectSidebar } from "@/features/workspace/components/project-sidebar";
import { TaskBoard } from "@/features/workspace/components/task-board";
import { WorkspaceHeader } from "@/features/workspace/components/workspace-header";
import { WorkspaceSideCards } from "@/features/workspace/components/workspace-side-cards";
import type {
  Project,
  StoredFile,
  Task,
  WorkspacePageData,
} from "@/features/workspace/types";

type TaskOptimisticAction =
  | { type: "create"; task: Task }
  | { type: "update"; taskId: string; patch: Partial<Task> }
  | { type: "toggle"; taskId: string; done: boolean }
  | { type: "delete"; taskId: string }
  | { type: "reorder"; orderedIds: string[] };

type FileOptimisticAction = { type: "upload"; file: StoredFile };

type ProjectOptimisticAction =
  | { type: "create"; project: Project }
  | { type: "update"; projectId: string; patch: Partial<Project> }
  | { type: "reorder"; orderedIds: string[] };

function reorderByIds<T extends { id: string }>(items: T[], orderedIds: string[]) {
  const orderMap = new Map(orderedIds.map((id, index) => [id, index]));

  return [...items].sort((left, right) => {
    const leftOrder = orderMap.get(left.id) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = orderMap.get(right.id) ?? Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder;
  });
}

export function WorkspaceInteractive({
  user,
  projects,
  tasks,
  selectedProjectId,
  projectFiles,
}: WorkspacePageData) {
  const router = useRouter();
  const createProjectFormRef = useRef<HTMLFormElement>(null);
  const createTaskFormRef = useRef<HTMLFormElement>(null);
  const uploadFormRef = useRef<HTMLFormElement>(null);

  const [isCreatingProject, startCreateProject] = useTransition();
  const [isMutatingTask, startTaskMutation] = useTransition();
  const [isUpdatingProject, startProjectUpdate] = useTransition();
  const [isUploadingFile, startUpload] = useTransition();
  const [isOpeningFile, startOpenFile] = useTransition();
  const [taskError, setTaskError] = useState<string | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [openingFilePath, setOpeningFilePath] = useState<string | null>(null);

  const [optimisticProjects, updateOptimisticProjects] = useOptimistic(
    projects,
    (currentProjects, action: ProjectOptimisticAction) => {
      if (action.type === "create") {
        return [action.project, ...currentProjects];
      }

      if (action.type === "update") {
        return currentProjects.map((project) =>
          project.id === action.projectId ? { ...project, ...action.patch } : project,
        );
      }

      if (action.type === "reorder") {
        return reorderByIds(
          currentProjects.map((project) => ({
            ...project,
            sortOrder: action.orderedIds.indexOf(project.id),
          })),
          action.orderedIds,
        );
      }

      return currentProjects;
    },
  );

  const [optimisticTasks, updateOptimisticTasks] = useOptimistic(
    tasks,
    (currentTasks, action: TaskOptimisticAction) => {
      if (action.type === "create") {
        return [...currentTasks, action.task];
      }

      if (action.type === "update") {
        return currentTasks.map((task) =>
          task.id === action.taskId ? { ...task, ...action.patch } : task,
        );
      }

      if (action.type === "toggle") {
        return currentTasks.map((task) =>
          task.id === action.taskId ? { ...task, done: action.done } : task,
        );
      }

      if (action.type === "delete") {
        return currentTasks.filter((task) => task.id !== action.taskId);
      }

      if (action.type === "reorder") {
        return currentTasks.map((task) => {
          const nextIndex = action.orderedIds.indexOf(task.id);
          return nextIndex >= 0 ? { ...task, sortOrder: nextIndex } : task;
        });
      }

      return currentTasks;
    },
  );

  const [optimisticFiles, updateOptimisticFiles] = useOptimistic(
    projectFiles,
    (currentFiles, action: FileOptimisticAction) => {
      if (action.type === "upload") {
        return [action.file, ...currentFiles];
      }

      return currentFiles;
    },
  );

  const selectedProject =
    optimisticProjects.find((project) => project.id === selectedProjectId) ?? null;

  const selectedProjectTasks = optimisticTasks
    .filter((task) => task.projectId === selectedProjectId)
    .sort((a, b) => {
      return (
        (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER) ||
        (a.createdAt ?? "").localeCompare(b.createdAt ?? "")
      );
    });

  const completedCount = selectedProjectTasks.filter((task) => task.done).length;
  const openTaskCount = optimisticTasks.filter((task) => !task.done).length;

  async function refreshBoard(nextProjectId?: string | null) {
    const target = nextProjectId ? `/?project=${encodeURIComponent(nextProjectId)}` : "/";
    router.replace(target);
    router.refresh();
  }

  function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProjectError(null);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (!name) {
      setProjectError("Project name is required.");
      return;
    }

    createProjectFormRef.current?.reset();

    startCreateProject(() => {
      updateOptimisticProjects({
        type: "create",
        project: {
          id: `optimistic-project-${Date.now()}`,
          name,
          description: description || null,
          sortOrder: -1,
          tone: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      void (async () => {
        try {
          const result = await createProjectAction(formData);
          await refreshBoard(result.projectId);
        } catch (error) {
          setProjectError(
            error instanceof Error ? error.message : "Unable to create project.",
          );
          router.refresh();
        }
      })();
    });
  }

  function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTaskError(null);

    if (!selectedProjectId) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const note = String(formData.get("note") ?? "").trim();
    const dueDate = String(formData.get("dueDate") ?? "").trim();

    if (!title) {
      setTaskError("Task title is required.");
      return;
    }

    createTaskFormRef.current?.reset();

    startTaskMutation(() => {
      updateOptimisticTasks({
        type: "create",
        task: {
          id: `optimistic-task-${Date.now()}`,
          title,
          note: note || null,
          dueDate: dueDate || null,
          sortOrder: selectedProjectTasks.length,
          done: false,
          projectId: selectedProjectId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      void (async () => {
        try {
          await createTaskAction(formData);
          router.refresh();
        } catch (error) {
          setTaskError(error instanceof Error ? error.message : "Unable to add task.");
          router.refresh();
        }
      })();
    });
  }

  function handleToggleProjectTone() {
    if (!selectedProject) {
      return;
    }

    const formData = new FormData();
    formData.set("projectId", selectedProject.id);
    formData.set("tone", selectedProject.tone ?? "active");

    startProjectUpdate(async () => {
      try {
        await archiveProjectAction(formData);
        await refreshBoard(selectedProject.id);
      } catch {
        router.refresh();
      }
    });
  }

  function handleUpdateProject(projectId: string, nextName: string, nextDescription: string) {
    const name = nextName.trim();

    if (!name) {
      setProjectError("Project name is required.");
      return;
    }

    setProjectError(null);
    const formData = new FormData();
    formData.set("projectId", projectId);
    formData.set("name", name);
    formData.set("description", nextDescription.trim());

    startProjectUpdate(() => {
      updateOptimisticProjects({
        type: "update",
        projectId,
        patch: {
          name,
          description: nextDescription.trim() || null,
        },
      });

      void (async () => {
        try {
          await updateProjectAction(formData);
          router.refresh();
        } catch (error) {
          setProjectError(
            error instanceof Error ? error.message : "Unable to update project.",
          );
          router.refresh();
        }
      })();
    });
  }

  function handleReorderProjects(orderedProjectIds: string[]) {
    const formData = new FormData();
    formData.set("orderedProjectIds", JSON.stringify(orderedProjectIds));

    startProjectUpdate(() => {
      updateOptimisticProjects({ type: "reorder", orderedIds: orderedProjectIds });

      void (async () => {
        try {
          await reorderProjectsAction(formData);
          router.refresh();
        } catch {
          router.refresh();
        }
      })();
    });
  }

  function handleToggleTask(task: Task) {
    const formData = new FormData();
    formData.set("taskId", task.id);
    formData.set("projectId", task.projectId);
    formData.set("done", String(task.done));

    startTaskMutation(() => {
      updateOptimisticTasks({
        type: "toggle",
        taskId: task.id,
        done: !task.done,
      });

      void (async () => {
        try {
          await toggleTaskAction(formData);
          router.refresh();
        } catch (error) {
          setTaskError(error instanceof Error ? error.message : "Unable to update task.");
          router.refresh();
        }
      })();
    });
  }

  function handleDeleteTask(task: Task) {
    const formData = new FormData();
    formData.set("taskId", task.id);
    formData.set("projectId", task.projectId);

    startTaskMutation(() => {
      updateOptimisticTasks({
        type: "delete",
        taskId: task.id,
      });

      void (async () => {
        try {
          await deleteTaskAction(formData);
          router.refresh();
        } catch (error) {
          setTaskError(error instanceof Error ? error.message : "Unable to delete task.");
          router.refresh();
        }
      })();
    });
  }

  function handleUpdateTask(task: Task, patch: Partial<Task>) {
    const title = (patch.title ?? task.title).trim();

    if (!title) {
      setTaskError("Task title is required.");
      return;
    }

    setTaskError(null);
    const formData = new FormData();
    formData.set("taskId", task.id);
    formData.set("projectId", task.projectId);
    formData.set("title", title);
    formData.set("note", (patch.note ?? task.note ?? "").trim());
    formData.set("dueDate", (patch.dueDate ?? task.dueDate ?? "").trim());

    startTaskMutation(() => {
      updateOptimisticTasks({
        type: "update",
        taskId: task.id,
        patch: {
          title,
          note: (patch.note ?? task.note ?? "").trim() || null,
          dueDate: (patch.dueDate ?? task.dueDate ?? "").trim() || null,
        },
      });

      void (async () => {
        try {
          await updateTaskAction(formData);
          router.refresh();
        } catch (error) {
          setTaskError(error instanceof Error ? error.message : "Unable to update task.");
          router.refresh();
        }
      })();
    });
  }

  function handleReorderTasks(orderedTaskIds: string[]) {
    if (!selectedProjectId) {
      return;
    }

    const formData = new FormData();
    formData.set("projectId", selectedProjectId);
    formData.set("orderedTaskIds", JSON.stringify(orderedTaskIds));

    startTaskMutation(() => {
      updateOptimisticTasks({ type: "reorder", orderedIds: orderedTaskIds });

      void (async () => {
        try {
          await reorderTasksAction(formData);
          router.refresh();
        } catch (error) {
          setTaskError(error instanceof Error ? error.message : "Unable to reorder tasks.");
          router.refresh();
        }
      })();
    });
  }

  function handleUploadFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadError(null);

    if (!selectedProjectId) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      setUploadError("Select a file before uploading.");
      return;
    }

    uploadFormRef.current?.reset();

    startUpload(() => {
      updateOptimisticFiles({
        type: "upload",
        file: {
          path: `${selectedProjectId}/${Date.now()}-${file.name}`,
          size: file.size,
          lastModified: null,
          uploading: true,
        },
      });

      void (async () => {
        try {
          await uploadProjectFileAction(formData);
          router.refresh();
        } catch (error) {
          setUploadError(error instanceof Error ? error.message : "Unable to upload file.");
          router.refresh();
        }
      })();
    });
  }

  function handleOpenFile(path: string) {
    if (!selectedProjectId) {
      return;
    }

    setUploadError(null);
    const formData = new FormData();
    formData.set("projectId", selectedProjectId);
    formData.set("path", path);

    startOpenFile(() => {
      setOpeningFilePath(path);

      void (async () => {
        try {
          const { url } = await getProjectFileUrlAction(formData);
          window.location.assign(url);
        } catch (error) {
          setUploadError(error instanceof Error ? error.message : "Unable to open file.");
        } finally {
          setOpeningFilePath(null);
        }
      })();
    });
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.55),_rgba(255,255,255,0)_24%),linear-gradient(180deg,_#16120f_0%,_#211b16_28%,_#efe7da_28%,_#ece6dc_100%)] px-4 py-4 text-stone-950 sm:px-6 sm:py-6">
      <div className="mx-auto flex max-w-[1380px] flex-col gap-5">
        <WorkspaceHeader
          user={user}
          projectCount={optimisticProjects.length}
          openTaskCount={openTaskCount}
        />

        <section className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <ProjectSidebar
            projects={optimisticProjects}
            tasks={optimisticTasks}
            selectedProjectId={selectedProjectId}
            projectError={projectError}
            isCreatingProject={isCreatingProject}
            isUpdatingProject={isUpdatingProject}
            createProjectFormRef={createProjectFormRef}
            onCreateProject={handleCreateProject}
            onReorderProjects={handleReorderProjects}
          />

          <div className="grid gap-5">
            <TaskBoard
              selectedProject={selectedProject}
              selectedProjectId={selectedProjectId}
              selectedProjectTasks={selectedProjectTasks}
              completedCount={completedCount}
              isMutatingTask={isMutatingTask}
              isUpdatingProject={isUpdatingProject}
              taskError={taskError}
              createTaskFormRef={createTaskFormRef}
              onCreateTask={handleCreateTask}
              onUpdateProject={handleUpdateProject}
              onToggleProjectTone={handleToggleProjectTone}
              onToggleTask={handleToggleTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onReorderTasks={handleReorderTasks}
            />

            <section className="grid gap-5 lg:grid-cols-3">
        <ProjectFilesPanel
          selectedProjectId={selectedProjectId}
          files={optimisticFiles}
          uploadError={uploadError}
          isUploadingFile={isUploadingFile}
          openingFilePath={isOpeningFile ? openingFilePath : null}
          uploadFormRef={uploadFormRef}
          onUploadFile={handleUploadFile}
          onOpenFile={handleOpenFile}
        />
              <WorkspaceSideCards user={user} />
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
