import type { FormEvent, RefObject } from "react";

import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SpinnerLabel } from "@/features/workspace/components/spinner-label";
import type { Project, Task } from "@/features/workspace/types";

export function TaskBoard({
  selectedProject,
  selectedProjectId,
  selectedProjectTasks,
  completedCount,
  isMutatingTask,
  isUpdatingProject,
  taskError,
  createTaskFormRef,
  onCreateTask,
  onToggleProjectTone,
  onToggleTask,
  onDeleteTask,
}: {
  selectedProject: Project | null;
  selectedProjectId: string | null;
  selectedProjectTasks: Task[];
  completedCount: number;
  isMutatingTask: boolean;
  isUpdatingProject: boolean;
  taskError: string | null;
  createTaskFormRef: RefObject<HTMLFormElement | null>;
  onCreateTask: (event: FormEvent<HTMLFormElement>) => void;
  onToggleProjectTone: () => void;
  onToggleTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}) {
  return (
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
              onClick={onToggleProjectTone}
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
          onSubmit={onCreateTask}
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
            <Button
              className="h-11 w-full md:w-auto"
              type="submit"
              disabled={!selectedProjectId || isMutatingTask}
            >
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
                onClick={() => onToggleTask(task)}
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
                  type="button"
                  variant="outline"
                  disabled={isMutatingTask}
                  onClick={() => onToggleTask(task)}
                >
                  {isMutatingTask ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : task.done ? (
                    "Undo"
                  ) : (
                    "Done"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isMutatingTask}
                  onClick={() => onDeleteTask(task)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
