"use client";

import type { FormEvent } from "react";
import { useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  archiveProjectAction,
  createProjectAction,
  createTaskAction,
  deleteTaskAction,
  toggleTaskAction,
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
  | { type: "toggle"; taskId: string; done: boolean }
  | { type: "delete"; taskId: string };

type FileOptimisticAction = { type: "upload"; file: StoredFile };

type ProjectOptimisticAction = { type: "create"; project: Project };

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
  const [taskError, setTaskError] = useState<string | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [optimisticProjects, updateOptimisticProjects] = useOptimistic(
    projects,
    (currentProjects, action: ProjectOptimisticAction) => {
      if (action.type === "create") {
        return [action.project, ...currentProjects];
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

      if (action.type === "toggle") {
        return currentTasks.map((task) =>
          task.id === action.taskId ? { ...task, done: action.done } : task,
        );
      }

      if (action.type === "delete") {
        return currentTasks.filter((task) => task.id !== action.taskId);
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
      if (a.done !== b.done) {
        return a.done ? 1 : -1;
      }

      return (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
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
          const response = await fetch("/api/files/upload", {
            method: "POST",
            body: formData,
          });

          const payload = (await response.json()) as {
            error?: string;
          };

          if (!response.ok) {
            throw new Error(payload.error || "Unable to upload file.");
          }

          router.refresh();
        } catch (error) {
          setUploadError(error instanceof Error ? error.message : "Unable to upload file.");
          router.refresh();
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
            createProjectFormRef={createProjectFormRef}
            onCreateProject={handleCreateProject}
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
              onToggleProjectTone={handleToggleProjectTone}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
            />

            <section className="grid gap-5 lg:grid-cols-3">
              <ProjectFilesPanel
                selectedProjectId={selectedProjectId}
                files={optimisticFiles}
                uploadError={uploadError}
                isUploadingFile={isUploadingFile}
                uploadFormRef={uploadFormRef}
                onUploadFile={handleUploadFile}
              />
              <WorkspaceSideCards user={user} />
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
