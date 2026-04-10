import Link from "next/link";
import type { FormEvent, RefObject } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SpinnerLabel } from "@/features/workspace/components/spinner-label";
import type { Project, Task } from "@/features/workspace/types";

const toneLabels: Record<NonNullable<Project["tone"]>, string> = {
  backlog: "Backlog",
  active: "Active",
  paused: "Paused",
  done: "Done",
};

export function ProjectSidebar({
  projects,
  tasks,
  selectedProjectId,
  projectError,
  isCreatingProject,
  createProjectFormRef,
  onCreateProject,
}: {
  projects: Project[];
  tasks: Task[];
  selectedProjectId: string | null;
  projectError: string | null;
  isCreatingProject: boolean;
  createProjectFormRef: RefObject<HTMLFormElement | null>;
  onCreateProject: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Card className="rounded-[1.6rem] border-stone-200/80 bg-[linear-gradient(180deg,_rgba(249,241,230,0.96),_rgba(244,236,224,0.94))] shadow-[0_18px_48px_-40px_rgba(15,23,42,0.2)]">
      <CardHeader className="space-y-3">
        <CardTitle className="text-[1.45rem] font-semibold tracking-[-0.03em]">
          Projects
        </CardTitle>
        <p className="text-sm leading-7 text-stone-600">
          作成、更新、選択はすべて server action と query-string ベースで処理します。
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <form ref={createProjectFormRef} className="space-y-4" onSubmit={onCreateProject}>
          <div className="space-y-2">
            <Label htmlFor="project-name">Project name</Label>
            <Input
              id="project-name"
              name="name"
              autoComplete="off"
              placeholder="Shipping checklist"
              required
            />
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
            <SpinnerLabel
              pending={isCreatingProject}
              idle="Create project"
              busy="Creating..."
            />
          </Button>
        </form>

        <Separator />

        <div
          className={`space-y-3 transition ${
            isCreatingProject ? "opacity-75" : "opacity-100"
          }`}
        >
          {projects.length === 0 ? (
            <div className="rounded-[1.2rem] border border-dashed border-stone-300 bg-white/60 px-4 py-5 text-sm leading-7 text-stone-500">
              まだ Project がありません。最初のひとつを作ると右側に Task リストが出ます。
            </div>
          ) : null}

          {projects.map((project) => {
            const projectTasks = tasks.filter((task) => task.projectId === project.id);
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
                    <div className="text-[1.02rem] font-semibold tracking-[-0.02em]">
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
  );
}
