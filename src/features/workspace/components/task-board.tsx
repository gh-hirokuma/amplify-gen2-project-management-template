import { CalendarDays, GripVertical } from "lucide-react";
import { useRef, useState } from "react";
import type { DragEvent, FormEvent, RefObject } from "react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
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
  onUpdateProject,
  onToggleProjectTone,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  onReorderTasks,
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
  onUpdateProject: (projectId: string, name: string, description: string) => void;
  onToggleProjectTone: () => void;
  onToggleTask: (task: Task) => void;
  onUpdateTask: (task: Task, patch: Partial<Task>) => void;
  onDeleteTask: (task: Task) => void;
  onReorderTasks: (orderedTaskIds: string[]) => void;
}) {
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [projectNameDraft, setProjectNameDraft] = useState("");
  const [projectDescriptionDraft, setProjectDescriptionDraft] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [openDueDatePickerFor, setOpenDueDatePickerFor] = useState<string | null>(null);
  const [createDueDate, setCreateDueDate] = useState<Date | undefined>(undefined);
  const [createDueDateOpen, setCreateDueDateOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");
  const [editingTaskNote, setEditingTaskNote] = useState("");
  const hiddenDueDateRef = useRef<HTMLInputElement | null>(null);

  function formatDueDate(value: string | null) {
    if (!value) {
      return "期限を設定";
    }

    return format(new Date(`${value}T00:00:00`), "M月d日 (E)");
  }

  function handleProjectSubmit() {
    if (!selectedProject) {
      return;
    }

    onUpdateProject(selectedProject.id, projectNameDraft, projectDescriptionDraft);
    setIsEditingProject(false);
  }

  function handleTaskDrop(targetTaskId: string) {
    if (!draggedTaskId || draggedTaskId === targetTaskId) {
      return;
    }

    const orderedIds = selectedProjectTasks.map((task) => task.id);
    const fromIndex = orderedIds.indexOf(draggedTaskId);
    const toIndex = orderedIds.indexOf(targetTaskId);

    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    orderedIds.splice(toIndex, 0, orderedIds.splice(fromIndex, 1)[0]);
    onReorderTasks(orderedIds);
  }

  function startTaskEdit(task: Task) {
    setEditingTaskId(task.id);
    setEditingTaskTitle(task.title);
    setEditingTaskNote(task.note ?? "");
  }

  function cancelTaskEdit() {
    setEditingTaskId(null);
    setEditingTaskTitle("");
    setEditingTaskNote("");
  }

  function submitTaskEdit(task: Task) {
    onUpdateTask(task, {
      title: editingTaskTitle,
      note: editingTaskNote,
    });
    cancelTaskEdit();
  }

  return (
    <Card className="rounded-[1.6rem] border-stone-200/80 bg-[linear-gradient(180deg,_rgba(255,250,242,0.98),_rgba(251,247,240,0.96))] shadow-[0_18px_48px_-40px_rgba(15,23,42,0.2)]">
      <CardHeader className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          {selectedProject && isEditingProject ? (
            <div className="space-y-3">
              <input
                className="w-full rounded-2xl border border-stone-300 bg-white/90 px-4 py-3 text-[2rem] font-semibold tracking-[-0.04em] outline-none ring-0"
                value={projectNameDraft}
                onChange={(event) => setProjectNameDraft(event.target.value)}
              />
              <textarea
                className="min-h-24 w-full rounded-2xl border border-stone-300 bg-white/90 px-4 py-3 text-sm leading-7 text-stone-700 outline-none"
                value={projectDescriptionDraft}
                onChange={(event) => setProjectDescriptionDraft(event.target.value)}
              />
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" onClick={handleProjectSubmit}>
                  Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setProjectNameDraft(selectedProject.name);
                    setProjectDescriptionDraft(selectedProject.description ?? "");
                    setIsEditingProject(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <CardTitle
                className="cursor-text text-[2rem] font-semibold tracking-[-0.04em]"
                onDoubleClick={() => {
                  if (!selectedProject) {
                    return;
                  }

                  setProjectNameDraft(selectedProject.name);
                  setProjectDescriptionDraft(selectedProject.description ?? "");
                  setIsEditingProject(true);
                }}
              >
                {selectedProject?.name ?? "Pick a project"}
              </CardTitle>
              <p
                className="max-w-2xl cursor-text text-sm leading-7 text-stone-600"
                onDoubleClick={() => {
                  if (!selectedProject) {
                    return;
                  }

                  setProjectNameDraft(selectedProject.name);
                  setProjectDescriptionDraft(selectedProject.description ?? "");
                  setIsEditingProject(true);
                }}
              >
                {selectedProject?.description ??
                  "Project を選ぶか新規作成すると、その Project 専用の Task リストを扱えます。"}
              </p>
            </>
          )}
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
            {isUpdatingProject || isMutatingTask ? (
              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500">
                Syncing...
              </div>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={onToggleProjectTone}
            >
              {selectedProject.tone === "done" ? "Reopen" : "Mark done"}
            </Button>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          ref={createTaskFormRef}
          className="grid gap-4 md:grid-cols-[1.2fr_1fr_180px_auto]"
          onSubmit={(event) => {
            onCreateTask(event);
            setCreateDueDate(undefined);
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
              disabled={!selectedProjectId}
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
              disabled={!selectedProjectId}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-due-date">Due date</Label>
            <input
              ref={hiddenDueDateRef}
              id="task-due-date"
              name="dueDate"
              type="hidden"
              value={createDueDate ? format(createDueDate, "yyyy-MM-dd") : ""}
            />
            <Popover open={createDueDateOpen} onOpenChange={setCreateDueDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  className="h-10 w-full justify-start rounded-xl border border-stone-300 bg-white/90 px-3 text-left font-medium text-stone-700 hover:bg-stone-50"
                  disabled={!selectedProjectId}
                  type="button"
                  variant="outline"
                >
                  <CalendarDays className="mr-2 size-4 text-stone-500" />
                  {createDueDate ? format(createDueDate, "M月d日 (E)") : "期限を設定"}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-3">
                <Calendar
                  mode="single"
                  selected={createDueDate}
                  onSelect={(date) => {
                    setCreateDueDate(date);
                    setCreateDueDateOpen(false);
                  }}
                />
                {createDueDate ? (
                  <Button
                    className="mt-3 w-full"
                    size="sm"
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setCreateDueDate(undefined);
                      setCreateDueDateOpen(false);
                    }}
                  >
                    期限をクリア
                  </Button>
                ) : null}
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-end">
            <Button
              className="h-11 w-full md:w-auto"
              type="submit"
              disabled={!selectedProjectId}
            >
              Add task
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
              } ${isMutatingTask ? "opacity-85" : "opacity-100"} ${
                draggedTaskId === task.id ? "opacity-50" : ""
              }`}
              onDragEnd={() => setDraggedTaskId(null)}
              onDragOver={(event: DragEvent<HTMLDivElement>) => event.preventDefault()}
              onDrop={(event: DragEvent<HTMLDivElement>) => {
                event.preventDefault();
                handleTaskDrop(task.id);
                setDraggedTaskId(null);
              }}
            >
              <div className="mt-1 flex items-center gap-3">
                <button
                  aria-label={`${task.title} をドラッグして並び替え`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-stone-500 transition hover:bg-stone-100"
                  draggable
                  type="button"
                  onDragEnd={() => setDraggedTaskId(null)}
                  onDragStart={() => setDraggedTaskId(task.id)}
                >
                  <GripVertical className="size-4" />
                </button>
                <button
                  className={`h-5 w-5 rounded-full border transition ${
                    task.done
                      ? "border-emerald-600 bg-emerald-600"
                      : "border-stone-400 bg-white"
                  }`}
                  type="button"
                  aria-label={task.done ? "Mark task incomplete" : "Mark task complete"}
                  onClick={() => onToggleTask(task)}
                />
              </div>

              <div className="space-y-1.5">
                {editingTaskId === task.id ? (
                  <div className="space-y-3 rounded-[1rem] border border-stone-200 bg-stone-50/70 p-3">
                    <Input
                      autoFocus
                      className="h-11 bg-white"
                      value={editingTaskTitle}
                      onChange={(event) => setEditingTaskTitle(event.target.value)}
                    />
                    <textarea
                      className="min-h-24 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm leading-7 text-stone-700 outline-none"
                      value={editingTaskNote}
                      onChange={(event) => setEditingTaskNote(event.target.value)}
                    />
                    <div className="flex items-center gap-2">
                      <Button size="sm" type="button" onClick={() => submitTaskEdit(task)}>
                        Save
                      </Button>
                      <Button size="sm" type="button" variant="ghost" onClick={cancelTaskEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        className={`text-left text-base font-semibold tracking-[-0.01em] ${
                          task.done ? "text-emerald-900 line-through" : "text-stone-900"
                        }`}
                        type="button"
                        onDoubleClick={() => startTaskEdit(task)}
                      >
                        {task.title}
                      </button>
                      <Popover
                        open={openDueDatePickerFor === task.id}
                        onOpenChange={(open) =>
                          setOpenDueDatePickerFor(open ? task.id : null)
                        }
                      >
                        <PopoverTrigger asChild>
                          <button
                            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] ${
                              task.dueDate
                                ? "border-stone-300 bg-stone-100 text-stone-700"
                                : "border-dashed border-stone-300 bg-white text-stone-500"
                            }`}
                            type="button"
                          >
                            <CalendarDays className="size-3.5" />
                            {formatDueDate(task.dueDate)}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-auto p-3">
                          <Calendar
                            mode="single"
                            selected={
                              task.dueDate ? new Date(`${task.dueDate}T00:00:00`) : undefined
                            }
                            onSelect={(date) => {
                              onUpdateTask(task, {
                                dueDate: date ? format(date, "yyyy-MM-dd") : "",
                              });
                              setOpenDueDatePickerFor(null);
                            }}
                          />
                          {task.dueDate ? (
                            <Button
                              className="mt-3 w-full"
                              size="sm"
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                onUpdateTask(task, { dueDate: "" });
                                setOpenDueDatePickerFor(null);
                              }}
                            >
                              期限をクリア
                            </Button>
                          ) : null}
                        </PopoverContent>
                      </Popover>
                    </div>
                    <button
                      className={`block text-left text-sm leading-7 ${
                        task.done ? "text-emerald-700/80" : "text-stone-600"
                      }`}
                      type="button"
                      onDoubleClick={() => startTaskEdit(task)}
                    >
                      {task.note || "Double click to add a note"}
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onToggleTask(task)}
                >
                  {task.done ? "Undo" : "Done"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
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
