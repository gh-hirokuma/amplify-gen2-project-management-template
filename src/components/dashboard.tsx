"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchUserAttributes, getCurrentUser } from "aws-amplify/auth";
import { list, uploadData } from "aws-amplify/storage";

import type { Schema } from "@backend/data/resource";

import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { amplifyClient } from "@/lib/amplify-data";
import {
  buildProjectFilePath,
  getDisplayFileName,
  getProjectFilesPrefix,
} from "@/lib/project-files";

type SessionState =
  | { status: "loading" }
  | { status: "authenticated"; username: string; email?: string }
  | { status: "unauthenticated" };

type Project = Schema["Project"]["type"];
type Task = Schema["Task"]["type"];
type StoredFile = {
  path: string;
  size?: number;
  lastModified?: Date;
};

const toneLabels: Record<NonNullable<Project["tone"]>, string> = {
  backlog: "Backlog",
  active: "Active",
  paused: "Paused",
  done: "Done",
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

export function Dashboard() {
  const router = useRouter();
  const [session, setSession] = useState<SessionState>({ status: "loading" });
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskNote, setTaskNote] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [projectFiles, setProjectFiles] = useState<StoredFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const user = await getCurrentUser();
        const attributes = await fetchUserAttributes();

        if (!active) {
          return;
        }

        setSession({
          status: "authenticated",
          username: user.username,
          email: attributes.email,
        });
      } catch {
        if (!active) {
          return;
        }

        setSession({ status: "unauthenticated" });
        router.replace("/login");
      }
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (session.status !== "authenticated") {
      return;
    }

    const projectSubscription = amplifyClient.models.Project.observeQuery().subscribe(
      {
        next: ({ items }) => {
          const sorted = [...items].sort((a, b) =>
            a.createdAt && b.createdAt
              ? a.createdAt.localeCompare(b.createdAt)
              : a.name.localeCompare(b.name),
          );
          setProjects(sorted);
        },
        error: (caughtError) => {
          setError(caughtError instanceof Error ? caughtError.message : "Failed to load projects.");
        },
      },
    );

    const taskSubscription = amplifyClient.models.Task.observeQuery().subscribe({
      next: ({ items }) => {
        const sorted = [...items].sort((a, b) =>
          a.createdAt && b.createdAt
            ? a.createdAt.localeCompare(b.createdAt)
            : a.title.localeCompare(b.title),
        );
        setTasks(sorted);
      },
      error: (caughtError) => {
        setError(caughtError instanceof Error ? caughtError.message : "Failed to load tasks.");
      },
    });

    return () => {
      projectSubscription.unsubscribe();
      taskSubscription.unsubscribe();
    };
  }, [session.status]);

  useEffect(() => {
    if (projects.length === 0) {
      setSelectedProjectId(null);
      return;
    }

    if (selectedProjectId && projects.some((project) => project.id === selectedProjectId)) {
      return;
    }

    setSelectedProjectId(projects[0].id);
  }, [projects, selectedProjectId]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const selectedProjectTasks = useMemo(
    () =>
      tasks.filter((task) => task.projectId === selectedProjectId).sort((a, b) => {
        if (a.done !== b.done) {
          return a.done ? 1 : -1;
        }

        return (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
      }),
    [selectedProjectId, tasks],
  );

  const completedCount = selectedProjectTasks.filter((task) => task.done).length;

  async function refreshProjectFiles(projectId: string) {
    const response = await list({
      path: getProjectFilesPrefix(projectId),
      options: {
        pageSize: 100,
      },
    });

    const sorted = [...response.items].sort((a, b) => {
      const left = a.lastModified?.getTime() ?? 0;
      const right = b.lastModified?.getTime() ?? 0;
      return right - left;
    });

    setProjectFiles(
      sorted.map((item) => ({
        path: item.path,
        size: item.size,
        lastModified: item.lastModified,
      })),
    );
  }

  useEffect(() => {
    if (session.status !== "authenticated" || !selectedProjectId) {
      setProjectFiles([]);
      return;
    }

    let active = true;

    void refreshProjectFiles(selectedProjectId).catch((caughtError) => {
      if (!active) {
        return;
      }

      setError(caughtError instanceof Error ? caughtError.message : "Failed to load files.");
    });

    return () => {
      active = false;
    };
  }, [selectedProjectId, session.status]);

  async function handleCreateProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("project");
    setError(null);

    try {
      const { data, errors } = await amplifyClient.models.Project.create({
        name: projectName,
        description: projectDescription || undefined,
        tone: "active",
      });
      presentErrors(errors);
      setProjectName("");
      setProjectDescription("");

      if (data?.id) {
        setSelectedProjectId(data.id);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to create project.");
    } finally {
      setBusy(null);
    }
  }

  async function handleCreateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProjectId) {
      return;
    }

    setBusy("task");
    setError(null);

    try {
      const { errors } = await amplifyClient.models.Task.create({
        title: taskTitle,
        note: taskNote || undefined,
        done: false,
        projectId: selectedProjectId,
      });
      presentErrors(errors);
      setTaskTitle("");
      setTaskNote("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to create task.");
    } finally {
      setBusy(null);
    }
  }

  async function toggleTask(task: Task) {
    setBusy(task.id);
    setError(null);

    try {
      const { errors } = await amplifyClient.models.Task.update({
        id: task.id,
        done: !task.done,
      });
      presentErrors(errors);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to update task.");
    } finally {
      setBusy(null);
    }
  }

  async function deleteTask(task: Task) {
    setBusy(`delete-${task.id}`);
    setError(null);

    try {
      const { errors } = await amplifyClient.models.Task.delete({
        id: task.id,
      });
      presentErrors(errors);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to delete task.");
    } finally {
      setBusy(null);
    }
  }

  async function archiveProject(project: Project) {
    setBusy(`project-${project.id}`);
    setError(null);

    try {
      const { errors } = await amplifyClient.models.Project.update({
        id: project.id,
        tone: project.tone === "done" ? "active" : "done",
      });
      presentErrors(errors);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to update project.");
    } finally {
      setBusy(null);
    }
  }

  async function handleUploadFile() {
    if (!selectedProjectId || !pendingFile) {
      return;
    }

    setBusy("upload");
    setUploadProgress(0);
    setError(null);

    try {
      const path = buildProjectFilePath({
        projectId: selectedProjectId,
        fileName: pendingFile.name,
      });

      await uploadData({
        path,
        data: pendingFile,
        options: {
          contentType: pendingFile.type || undefined,
          onProgress: ({ transferredBytes, totalBytes }) => {
            if (!totalBytes) {
              return;
            }

            setUploadProgress(Math.round((transferredBytes / totalBytes) * 100));
          },
        },
      }).result;

      setPendingFile(null);
      setUploadProgress(null);
      await refreshProjectFiles(selectedProjectId);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to upload file.");
    } finally {
      setBusy(null);
      setUploadProgress(null);
    }
  }

  async function openSignedFileUrl(file: StoredFile) {
    if (!selectedProjectId) {
      return;
    }

    setBusy(`signed-${file.path}`);
    setError(null);

    try {
      const { data, errors } = await amplifyClient.queries.getSignedProjectFileUrl({
        projectId: selectedProjectId,
        path: file.path,
      });

      presentErrors(errors);

      if (!data?.url) {
        throw new Error("Signed URL was not returned.");
      }

      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to get signed URL.");
    } finally {
      setBusy(null);
    }
  }

  if (session.status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#111113] text-stone-100">
        <div className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-stone-300">
          Restoring session
        </div>
      </main>
    );
  }

  if (session.status !== "authenticated") {
    return null;
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#15110d_0%,_#1f1712_38%,_#efe3d1_38%,_#efe3d1_100%)] px-4 py-4 text-stone-950 sm:px-6 sm:py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="rounded-[2rem] bg-[#16110d] px-6 py-7 text-stone-50 shadow-[0_28px_80px_-40px_rgba(0,0,0,0.75)] sm:px-8 sm:py-9">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300/90">
                Authenticated workspace
              </p>
              <div className="space-y-3">
                <div className="text-sm leading-7 text-stone-300 sm:text-base">
                  {session.email ?? session.username}
                </div>
                <h1 className="max-w-2xl font-heading text-4xl leading-[0.98] tracking-[-0.05em] text-stone-50 sm:text-6xl">
                  Project と Task を片づけるための board
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-stone-300 sm:text-base">
                  Project を単位にして Task を積み、片づけ、DynamoDB に残す。
                  サインインした本人だけが見えるシンプルな作業面です。
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-400">
                  Active projects
                </div>
                <div className="mt-1 text-2xl font-semibold">{projects.length}</div>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-400">
                  Open tasks
                </div>
                <div className="mt-1 text-2xl font-semibold">
                  {tasks.filter((task) => !task.done).length}
                </div>
              </div>
              <LogoutButton />
            </div>
          </div>
        </header>

        {error ? (
          <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm leading-7 text-red-800">
            {error}
          </div>
        ) : null}

        <section className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="border-stone-200/70 bg-[#f6efe4] shadow-[0_20px_60px_-42px_rgba(15,23,42,0.28)]">
            <CardHeader className="space-y-3">
              <CardTitle className="text-2xl tracking-[-0.03em]">Projects</CardTitle>
              <p className="text-sm leading-7 text-stone-600">
                TODO の束を Project 単位で分けます。ひとつの Project に複数 Task を持てます。
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <form className="space-y-4" onSubmit={handleCreateProject}>
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project name</Label>
                  <Input
                    id="project-name"
                    autoComplete="off"
                    placeholder="Shipping checklist"
                    value={projectName}
                    onChange={(event) => setProjectName(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-description">Description</Label>
                  <Input
                    id="project-description"
                    autoComplete="off"
                    placeholder="What does this project need?"
                    value={projectDescription}
                    onChange={(event) => setProjectDescription(event.target.value)}
                  />
                </div>
                <Button className="h-11 w-full" type="submit" disabled={busy === "project"}>
                  {busy === "project" ? "Creating..." : "Create project"}
                </Button>
              </form>

              <Separator />

              <div className="space-y-3">
                {projects.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-white/60 px-4 py-5 text-sm leading-7 text-stone-500">
                    まだ Project がありません。最初のひとつを作ると右側に Task リストが出ます。
                  </div>
                ) : null}

                {projects.map((project) => {
                  const projectTasks = tasks.filter((task) => task.projectId === project.id);
                  const openCount = projectTasks.filter((task) => !task.done).length;
                  const active = project.id === selectedProjectId;

                  return (
                    <button
                      key={project.id}
                      className={`w-full rounded-[1.5rem] border px-4 py-4 text-left transition ${
                        active
                          ? "border-stone-950 bg-stone-950 text-stone-50 shadow-lg"
                          : "border-stone-200 bg-white/80 text-stone-800 hover:border-stone-400 hover:bg-white"
                      }`}
                      onClick={() => setSelectedProjectId(project.id)}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5">
                          <div className="text-lg font-semibold tracking-[-0.02em]">
                            {project.name}
                          </div>
                          <div
                            className={`text-sm leading-6 ${
                              active ? "text-stone-300" : "text-stone-500"
                            }`}
                          >
                            {project.description || "No description"}
                          </div>
                        </div>
                        <div
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${
                            active
                              ? "bg-white/10 text-amber-200"
                              : "bg-stone-100 text-stone-500"
                          }`}
                        >
                          {toneLabels[project.tone ?? "backlog"]}
                        </div>
                      </div>
                      <div
                        className={`mt-4 flex items-center justify-between text-xs uppercase tracking-[0.24em] ${
                          active ? "text-stone-400" : "text-stone-500"
                        }`}
                      >
                        <span>{openCount} open</span>
                        <span>{projectTasks.length} total</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5">
            <Card className="border-stone-200/70 bg-[#fffaf2] shadow-[0_20px_60px_-42px_rgba(15,23,42,0.28)]">
              <CardHeader className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-3">
                  <CardTitle className="text-3xl tracking-[-0.04em]">
                    {selectedProject?.name ?? "Pick a project"}
                  </CardTitle>
                  <p className="max-w-2xl text-sm leading-7 text-stone-600">
                    {selectedProject?.description ??
                      "Project を選ぶか新規作成すると、その Project 専用の Task リストを扱えます。"}
                  </p>
                </div>

                {selectedProject ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-[1.25rem] border border-stone-200 bg-white px-4 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
                        Progress
                      </div>
                      <div className="mt-1 text-lg font-semibold text-stone-900">
                        {completedCount}/{selectedProjectTasks.length || 0}
                      </div>
                    </div>
                    <Button
                      onClick={() => archiveProject(selectedProject)}
                      type="button"
                      variant="outline"
                      disabled={busy === `project-${selectedProject.id}`}
                    >
                      {selectedProject.tone === "done" ? "Reopen" : "Mark done"}
                    </Button>
                  </div>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-6">
                <form className="grid gap-4 md:grid-cols-[1.2fr_1fr_auto]" onSubmit={handleCreateTask}>
                  <div className="space-y-2">
                    <Label htmlFor="task-title">Task title</Label>
                    <Input
                      id="task-title"
                      placeholder="Write migration notes"
                      autoComplete="off"
                      value={taskTitle}
                      onChange={(event) => setTaskTitle(event.target.value)}
                      disabled={!selectedProjectId}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task-note">Task note</Label>
                    <Input
                      id="task-note"
                      placeholder="Anything the next person should know"
                      autoComplete="off"
                      value={taskNote}
                      onChange={(event) => setTaskNote(event.target.value)}
                      disabled={!selectedProjectId}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      className="h-11 w-full md:w-auto"
                      type="submit"
                      disabled={!selectedProjectId || busy === "task"}
                    >
                      {busy === "task" ? "Adding..." : "Add task"}
                    </Button>
                  </div>
                </form>

                <Separator />

                <div className="space-y-3">
                  {!selectedProject ? (
                    <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-sm leading-7 text-stone-500">
                      左の Project を選ぶと Task を並べられます。
                    </div>
                  ) : null}

                  {selectedProject && selectedProjectTasks.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-sm leading-7 text-stone-500">
                      まだ Task がありません。次にやることを 1 件追加してください。
                    </div>
                  ) : null}

                  {selectedProjectTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`grid gap-3 rounded-[1.5rem] border px-4 py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start ${
                        task.done
                          ? "border-emerald-200 bg-emerald-50/90"
                          : "border-stone-200 bg-white/90"
                      }`}
                    >
                      <button
                        className={`mt-1 h-5 w-5 rounded-full border transition ${
                          task.done
                            ? "border-emerald-600 bg-emerald-600"
                            : "border-stone-400 bg-white"
                        }`}
                        onClick={() => toggleTask(task)}
                        type="button"
                        disabled={busy === task.id}
                        aria-label={task.done ? "Mark task incomplete" : "Mark task complete"}
                      />

                      <div className="space-y-1.5">
                        <div
                          className={`text-base font-semibold tracking-[-0.01em] ${
                            task.done ? "text-emerald-900 line-through" : "text-stone-900"
                          }`}
                        >
                          {task.title}
                        </div>
                        <div
                          className={`text-sm leading-7 ${
                            task.done ? "text-emerald-700/80" : "text-stone-600"
                          }`}
                        >
                          {task.note || "No note"}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:justify-end">
                        <Button
                          onClick={() => toggleTask(task)}
                          type="button"
                          variant="outline"
                          disabled={busy === task.id}
                        >
                          {task.done ? "Undo" : "Done"}
                        </Button>
                        <Button
                          onClick={() => deleteTask(task)}
                          type="button"
                          variant="ghost"
                          disabled={busy === `delete-${task.id}`}
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
              <Card className="border-stone-200/70 bg-[#f8f2ea] lg:col-span-2">
                <CardHeader className="space-y-3">
                  <CardTitle className="text-xl tracking-[-0.03em]">Project files</CardTitle>
                  <p className="text-sm leading-7 text-stone-600">
                    S3 へアップロードしたファイルを project 単位で束ねます。署名付き URL は
                    Cognito でログイン中のユーザだけが Lambda 経由で取得できます。
                  </p>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="space-y-2">
                      <Label htmlFor="project-file">Upload file</Label>
                      <Input
                        id="project-file"
                        type="file"
                        onChange={(event) => setPendingFile(event.target.files?.[0] ?? null)}
                        disabled={!selectedProjectId || busy === "upload"}
                      />
                      <p className="text-xs leading-6 text-stone-500">
                        {pendingFile
                          ? `${pendingFile.name} (${Math.round(pendingFile.size / 1024)} KB)`
                          : "選択した Project 配下に保存されます。"}
                      </p>
                    </div>
                    <div className="flex items-end">
                      <Button
                        className="h-11 w-full md:w-auto"
                        type="button"
                        disabled={!selectedProjectId || !pendingFile || busy === "upload"}
                        onClick={() => void handleUploadFile()}
                      >
                        {busy === "upload"
                          ? uploadProgress
                            ? `Uploading ${uploadProgress}%`
                            : "Uploading..."
                          : "Upload to S3"}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    {!selectedProjectId ? (
                      <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-sm leading-7 text-stone-500">
                        まず Project を選んでください。
                      </div>
                    ) : null}

                    {selectedProjectId && projectFiles.length === 0 ? (
                      <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-sm leading-7 text-stone-500">
                        まだファイルがありません。最初の 1 件を S3 へアップロードしてください。
                      </div>
                    ) : null}

                    {projectFiles.map((file) => (
                      <div
                        key={file.path}
                        className="grid gap-3 rounded-[1.5rem] border border-stone-200 bg-white/90 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                      >
                        <div className="min-w-0 space-y-1.5">
                          <div className="truncate text-base font-semibold tracking-[-0.01em] text-stone-900">
                            {getDisplayFileName(file.path)}
                          </div>
                          <div className="text-sm leading-6 text-stone-600">
                            {file.lastModified
                              ? file.lastModified.toLocaleString("ja-JP")
                              : "Uploaded just now"}
                            {" · "}
                            {typeof file.size === "number"
                              ? `${Math.max(1, Math.round(file.size / 1024))} KB`
                              : "Size unknown"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            disabled={busy === `signed-${file.path}`}
                            onClick={() => void openSignedFileUrl(file)}
                          >
                            {busy === `signed-${file.path}` ? "Preparing..." : "Open signed URL"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-stone-200/70 bg-[#f8f2ea]">
                <CardHeader>
                  <CardTitle className="text-xl tracking-[-0.03em]">Current user</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-7 text-stone-600">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
                      Username
                    </div>
                    <div className="mt-1 text-base font-medium text-stone-900">
                      {session.username}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500">
                      Email
                    </div>
                    <div className="mt-1 text-base font-medium text-stone-900">
                      {session.email ?? "Not set"}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-stone-200/70 bg-[#f8f2ea] lg:col-span-3">
                <CardHeader>
                  <CardTitle className="text-xl tracking-[-0.03em]">Implementation notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-7 text-stone-600">
                  <p>
                    Auth lives in <code>amplify/auth/resource.ts</code>.
                  </p>
                  <p>
                    Project と Task の DynamoDB-backed schema は{" "}
                    <code>amplify/data/resource.ts</code> にあります。
                  </p>
                  <p>
                    Frontend data client is configured in{" "}
                    <code>src/lib/amplify-data.ts</code>.
                  </p>
                  <p>
                    S3 bucket auth lives in <code>amplify/storage/resource.ts</code>, and the
                    signed URL Lambda is exposed from <code>amplify/functions/get-project-file-url</code>.
                  </p>
                </CardContent>
              </Card>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
