"use client";

import Link from "next/link";
import { useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, UploadCloud } from "lucide-react";

import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  archiveProjectAction,
  createProjectAction,
  createTaskAction,
  deleteTaskAction,
  toggleTaskAction,
} from "@/lib/server/dashboard-actions";
import { getDisplayFileName } from "@/lib/project-files";

type Project = {
  id: string;
  name: string;
  description: string | null;
  tone: "backlog" | "active" | "paused" | "done" | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type Task = {
  id: string;
  title: string;
  note: string | null;
  done: boolean;
  projectId: string;
  createdAt: string | null;
  updatedAt: string | null;
};

type StoredFile = {
  path: string;
  size?: number;
  lastModified?: string | null;
  uploading?: boolean;
};

type DashboardInteractiveProps = {
  user: {
    username: string;
    loginId: string;
  };
  projects: Project[];
  tasks: Task[];
  selectedProjectId: string | null;
  projectFiles: StoredFile[];
};

type TaskOptimisticAction =
  | { type: "create"; task: Task & { optimistic?: boolean } }
  | { type: "toggle"; taskId: string; done: boolean }
  | { type: "delete"; taskId: string };

type FileOptimisticAction = { type: "upload"; file: StoredFile } | { type: "reset" };

type ProjectOptimisticAction = { type: "create"; project: Project & { optimistic?: boolean } };

const toneLabels: Record<NonNullable<Project["tone"]>, string> = {
  backlog: "Backlog",
  active: "Active",
  paused: "Paused",
  done: "Done",
};

function formatFileMeta(file: StoredFile) {
  const updatedAt = file.lastModified
    ? new Date(file.lastModified).toLocaleString("ja-JP")
    : file.uploading
      ? "Uploading..."
      : "Uploaded just now";
  const size =
    typeof file.size === "number"
      ? `${Math.max(1, Math.round(file.size / 1024))} KB`
      : file.uploading
        ? "Preparing file"
        : "Size unknown";

  return `${updatedAt} · ${size}`;
}

function SpinnerLabel({
  pending,
  idle,
  busy,
}: {
  pending: boolean;
  idle: string;
  busy: string;
}) {
  return pending ? (
    <span className="inline-flex items-center gap-2">
      <LoaderCircle className="size-4 animate-spin" />
      {busy}
    </span>
  ) : (
    <span>{idle}</span>
  );
}

export function DashboardInteractive({
  user,
  projects,
  tasks,
  selectedProjectId,
  projectFiles,
}: DashboardInteractiveProps) {
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

  async function refreshBoard(nextProjectId?: string | null) {
    const target = nextProjectId ? `/?project=${encodeURIComponent(nextProjectId)}` : "/";
    router.replace(target);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.55),_rgba(255,255,255,0)_24%),linear-gradient(180deg,_#16120f_0%,_#211b16_28%,_#efe7da_28%,_#ece6dc_100%)] px-4 py-4 text-stone-950 sm:px-6 sm:py-6">
      <div className="mx-auto flex max-w-[1380px] flex-col gap-5">
        <header className="overflow-hidden rounded-[1.85rem] bg-[linear-gradient(135deg,_#17130f_0%,_#201913_52%,_#2b221c_100%)] px-6 py-7 text-stone-50 shadow-[0_28px_72px_-44px_rgba(0,0,0,0.72)] sm:px-8 sm:py-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl space-y-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-300/90">
                Authenticated workspace
              </p>
              <div className="space-y-3">
                <div className="text-sm leading-7 text-stone-300 sm:text-base">{user.loginId}</div>
                <h1 className="max-w-2xl text-[2.4rem] font-semibold leading-[0.94] tracking-[-0.06em] text-stone-50 sm:text-[4.4rem]">
                  PROJECT DASHBOARD
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-stone-300 sm:text-[15px]">
                  ログイン UI は custom form のままにしつつ、Data、Storage、署名 URL の処理は
                  Next.js App Router の server component / server action / route handler で実行します。
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 backdrop-blur">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                  Active projects
                </div>
                <div className="mt-1 text-2xl font-semibold">{optimisticProjects.length}</div>
              </div>
              <div className="rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 backdrop-blur">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                  Open tasks
                </div>
                <div className="mt-1 text-2xl font-semibold">
                  {optimisticTasks.filter((task) => !task.done).length}
                </div>
              </div>
              <LogoutButton />
            </div>
          </div>
        </header>

        <section className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="rounded-[1.6rem] border-stone-200/80 bg-[linear-gradient(180deg,_rgba(249,241,230,0.96),_rgba(244,236,224,0.94))] shadow-[0_18px_48px_-40px_rgba(15,23,42,0.2)]">
            <CardHeader className="space-y-3">
              <CardTitle className="text-[1.45rem] font-semibold tracking-[-0.03em]">Projects</CardTitle>
              <p className="text-sm leading-7 text-stone-600">
                作成、更新、選択はすべて server action と query-string ベースで処理します。
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <form
                ref={createProjectFormRef}
                className="space-y-4"
                onSubmit={(event) => {
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
                      } as Project & { optimistic?: boolean },
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
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project name</Label>
                  <Input id="project-name" name="name" autoComplete="off" placeholder="Shipping checklist" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-description">Description</Label>
                  <Input
                    id="project-description"
                    name="description"
                    autoComplete="off"
                    placeholder="What does this project need?"
                  />
                </div>
                {projectError ? (
                  <div className="rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {projectError}
                  </div>
                ) : null}
                <Button className="h-11 w-full" type="submit" disabled={isCreatingProject}>
                  <SpinnerLabel pending={isCreatingProject} idle="Create project" busy="Creating..." />
                </Button>
              </form>

              <Separator />

              <div className={`space-y-3 transition ${isCreatingProject ? "opacity-75" : "opacity-100"}`}>
                {optimisticProjects.length === 0 ? (
                  <div className="rounded-[1.2rem] border border-dashed border-stone-300 bg-white/60 px-4 py-5 text-sm leading-7 text-stone-500">
                    まだ Project がありません。最初のひとつを作ると右側に Task リストが出ます。
                  </div>
                ) : null}

                {optimisticProjects.map((project) => {
                  const projectTasks = optimisticTasks.filter((task) => task.projectId === project.id);
                  const openCount = projectTasks.filter((task) => !task.done).length;
                  const active = project.id === selectedProjectId;

                  return (
                    <Link
                      key={project.id}
                      className={`block w-full rounded-[1.15rem] border px-4 py-4 text-left transition ${
                        active
                          ? "border-stone-950 bg-[linear-gradient(180deg,_#17120e,_#231b16)] text-stone-50 shadow-[0_14px_34px_-24px_rgba(15,23,42,0.5)]"
                          : "border-stone-200/80 bg-white/86 text-stone-800 hover:border-stone-400 hover:bg-white"
                      }`}
                      href={`/?project=${encodeURIComponent(project.id)}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5">
                          <div className="text-[1.02rem] font-semibold tracking-[-0.02em]">{project.name}</div>
                          <div className={`text-sm leading-6 ${active ? "text-stone-300" : "text-stone-500"}`}>
                            {project.description || "No description"}
                          </div>
                        </div>
                        <div
                          className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                            active ? "bg-white/10 text-amber-200" : "bg-stone-100 text-stone-500"
                          }`}
                        >
                          {toneLabels[project.tone ?? "backlog"]}
                        </div>
                      </div>
                      <div
                        className={`mt-4 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] ${
                          active ? "text-stone-400" : "text-stone-500"
                        }`}
                      >
                        <span>{openCount} open</span>
                        <span>{projectTasks.length} total</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5">
            <Card className="rounded-[1.6rem] border-stone-200/80 bg-[linear-gradient(180deg,_rgba(255,250,242,0.98),_rgba(251,247,240,0.96))] shadow-[0_18px_48px_-40px_rgba(15,23,42,0.2)]">
              <CardHeader className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-3">
                  <CardTitle className="text-[2rem] font-semibold tracking-[-0.04em]">
                    {selectedProject?.name ?? "Pick a project"}
                  </CardTitle>
                  <p className="max-w-2xl text-sm leading-7 text-stone-600">
                    {selectedProject?.description ??
                      "Project を選ぶか新規作成すると、その Project 専用の Task リストを扱えます。"}
                  </p>
                </div>

                {selectedProject ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-[1rem] border border-stone-200/80 bg-white/90 px-4 py-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                        Progress
                      </div>
                      <div className="mt-1 text-lg font-semibold text-stone-900">
                        {completedCount}/{selectedProjectTasks.length || 0}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUpdatingProject}
                      onClick={() => {
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
                      }}
                    >
                      <SpinnerLabel
                        pending={isUpdatingProject}
                        idle={selectedProject.tone === "done" ? "Reopen" : "Mark done"}
                        busy="Updating..."
                      />
                    </Button>
                  </div>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-6">
                <form
                  ref={createTaskFormRef}
                  className="grid gap-4 md:grid-cols-[1.2fr_1fr_auto]"
                  onSubmit={(event) => {
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
                        } as Task & { optimistic?: boolean },
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
                  }}
                >
                  <input name="projectId" type="hidden" value={selectedProjectId ?? ""} />
                  <div className="space-y-2">
                    <Label htmlFor="task-title">Task title</Label>
                    <Input
                      id="task-title"
                      name="title"
                      placeholder="Write migration notes"
                      autoComplete="off"
                      disabled={!selectedProjectId || isMutatingTask}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task-note">Task note</Label>
                    <Input
                      id="task-note"
                      name="note"
                      placeholder="Anything the next person should know"
                      autoComplete="off"
                      disabled={!selectedProjectId || isMutatingTask}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button className="h-11 w-full md:w-auto" type="submit" disabled={!selectedProjectId || isMutatingTask}>
                      <SpinnerLabel pending={isMutatingTask} idle="Add task" busy="Adding..." />
                    </Button>
                  </div>
                </form>

                {taskError ? (
                  <div className="rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {taskError}
                  </div>
                ) : null}

                <Separator />

                <div className="space-y-3">
                  {!selectedProject ? (
                    <div className="rounded-[1.2rem] border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-sm leading-7 text-stone-500">
                      左の Project を選ぶと Task を並べられます。
                    </div>
                  ) : null}

                  {selectedProject && selectedProjectTasks.length === 0 ? (
                    <div className="rounded-[1.2rem] border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-sm leading-7 text-stone-500">
                      まだ Task がありません。次にやることを 1 件追加してください。
                    </div>
                  ) : null}

                  {selectedProjectTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`grid gap-3 rounded-[1.2rem] border px-4 py-4 transition sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start ${
                        task.done
                          ? "border-emerald-200/90 bg-[linear-gradient(180deg,_rgba(236,253,245,0.98),_rgba(225,247,237,0.9))]"
                          : "border-stone-200/80 bg-white/92"
                      } ${isMutatingTask ? "opacity-85" : "opacity-100"}`}
                    >
                      <button
                        className={`mt-1 h-5 w-5 rounded-full border transition ${
                          task.done ? "border-emerald-600 bg-emerald-600" : "border-stone-400 bg-white"
                        }`}
                        type="button"
                        aria-label={task.done ? "Mark task incomplete" : "Mark task complete"}
                        onClick={() => {
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
                                setTaskError(
                                  error instanceof Error ? error.message : "Unable to update task.",
                                );
                                router.refresh();
                              }
                            })();
                          });
                        }}
                      />

                      <div className="space-y-1.5">
                        <div
                          className={`text-base font-semibold tracking-[-0.01em] ${
                            task.done ? "text-emerald-900 line-through" : "text-stone-900"
                          }`}
                        >
                          {task.title}
                        </div>
                        <div className={`text-sm leading-7 ${task.done ? "text-emerald-700/80" : "text-stone-600"}`}>
                          {task.note || "No note"}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isMutatingTask}
                          onClick={() => {
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
                                  setTaskError(
                                    error instanceof Error ? error.message : "Unable to update task.",
                                  );
                                  router.refresh();
                                }
                              })();
                            });
                          }}
                        >
                          {isMutatingTask ? <LoaderCircle className="size-4 animate-spin" /> : task.done ? "Undo" : "Done"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={isMutatingTask}
                          onClick={() => {
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
                                  setTaskError(
                                    error instanceof Error ? error.message : "Unable to delete task.",
                                  );
                                  router.refresh();
                                }
                              })();
                            });
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <section className="grid gap-5 lg:grid-cols-3">
              <Card className="rounded-[1.6rem] border-stone-200/80 bg-[linear-gradient(180deg,_rgba(248,242,234,0.96),_rgba(244,238,229,0.94))] shadow-[0_18px_48px_-40px_rgba(15,23,42,0.18)] lg:col-span-2">
                <CardHeader className="space-y-3">
                  <CardTitle className="text-[1.25rem] font-semibold tracking-[-0.03em]">Project files</CardTitle>
                  <p className="text-sm leading-7 text-stone-600">
                    アップロードは server action、署名 URL は server route から発行します。
                    ブラウザはフォーム送信と通常リンクだけで動きます。
                  </p>
                </CardHeader>
                <CardContent className="space-y-5">
                  <form
                    ref={uploadFormRef}
                    className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]"
                    onSubmit={(event) => {
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
                              path?: string;
                            };

                            if (!response.ok) {
                              throw new Error(payload.error || "Unable to upload file.");
                            }

                            router.refresh();
                          } catch (error) {
                            setUploadError(
                              error instanceof Error ? error.message : "Unable to upload file.",
                            );
                            router.refresh();
                          }
                        })();
                      });
                    }}
                  >
                    <input name="projectId" type="hidden" value={selectedProjectId ?? ""} />
                    <div className="space-y-2">
                      <Label htmlFor="project-file">Upload file</Label>
                      <Input
                        id="project-file"
                        name="file"
                        type="file"
                        disabled={!selectedProjectId || isUploadingFile}
                      />
                      <p className="text-xs leading-6 text-stone-500">
                        {selectedProjectId
                          ? "選択した Project 配下に S3 保存されます。"
                          : "まず Project を選んでください。"}
                      </p>
                    </div>
                    <div className="flex items-end">
                      <Button className="h-11 w-full md:w-auto" type="submit" disabled={!selectedProjectId || isUploadingFile}>
                        {isUploadingFile ? (
                          <span className="inline-flex items-center gap-2">
                            <LoaderCircle className="size-4 animate-spin" />
                            Uploading...
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            <UploadCloud className="size-4" />
                            Upload to S3
                          </span>
                        )}
                      </Button>
                    </div>
                  </form>

                  {uploadError ? (
                    <div className="rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {uploadError}
                    </div>
                  ) : null}

                  <Separator />

                  <div className="space-y-3">
                    {!selectedProjectId ? (
                      <div className="rounded-[1.2rem] border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-sm leading-7 text-stone-500">
                        まず Project を選んでください。
                      </div>
                    ) : null}

                    {selectedProjectId && optimisticFiles.length === 0 ? (
                      <div className="rounded-[1.2rem] border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-sm leading-7 text-stone-500">
                        まだファイルがありません。最初の 1 件を S3 へアップロードしてください。
                      </div>
                    ) : null}

                    {optimisticFiles.map((file) => (
                      <div
                        key={file.path}
                        className={`grid gap-3 rounded-[1.2rem] border border-stone-200 bg-white/90 px-4 py-4 transition sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center ${
                          file.uploading ? "opacity-70" : "opacity-100"
                        }`}
                      >
                        <div className="min-w-0 space-y-1.5">
                          <div className="truncate text-base font-semibold tracking-[-0.01em] text-stone-900">
                            {getDisplayFileName(file.path)}
                          </div>
                          <div className="text-sm leading-6 text-stone-600">{formatFileMeta(file)}</div>
                        </div>
                        {file.uploading ? (
                          <div className="inline-flex items-center gap-2 text-sm text-stone-500">
                            <LoaderCircle className="size-4 animate-spin" />
                            Preparing URL...
                          </div>
                        ) : (
                          <a
                            href={`/api/files/open?projectId=${encodeURIComponent(selectedProjectId ?? "")}&path=${encodeURIComponent(file.path)}`}
                          >
                            <Button type="button" variant="outline">
                              Open signed URL
                            </Button>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[1.6rem] border-stone-200/80 bg-[linear-gradient(180deg,_rgba(248,242,234,0.96),_rgba(244,238,229,0.94))] shadow-[0_18px_48px_-40px_rgba(15,23,42,0.18)]">
                <CardHeader>
                  <CardTitle className="text-[1.25rem] font-semibold tracking-[-0.03em]">Current user</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-7 text-stone-600">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                      Username
                    </div>
                    <div className="mt-1 text-base font-medium text-stone-900">{user.username}</div>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                      Login
                    </div>
                    <div className="mt-1 text-base font-medium text-stone-900">{user.loginId}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[1.6rem] border-stone-200/80 bg-[linear-gradient(180deg,_rgba(248,242,234,0.96),_rgba(244,238,229,0.94))] shadow-[0_18px_48px_-40px_rgba(15,23,42,0.18)] lg:col-span-3">
                <CardHeader>
                  <CardTitle className="text-[1.25rem] font-semibold tracking-[-0.03em]">Implementation notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-7 text-stone-600">
                  <p>Task CRUD is now optimistic, so the board responds before the round-trip finishes.</p>
                  <p>Project create, archive, and file upload expose loading states instead of silent waits.</p>
                  <p>Server remains the source of truth, and each action ends with a refresh to reconcile state.</p>
                </CardContent>
              </Card>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
