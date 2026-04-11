"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Project } from "@/features/workspace/types";
import { requiredString, optionalString } from "@/server/form-data";
import { throwIfAmplifyErrors } from "@/server/amplify-errors";
import { cookiesClient, getCurrentUserOrNull } from "@/server/amplify";

async function requireAuthenticatedUser() {
  const user = await getCurrentUserOrNull();

  if (!user) {
    redirect("/login");
  }

  return user;
}

async function assertProjectAccess(projectId: string) {
  const { data, errors } = await cookiesClient.models.Project.get({ id: projectId });
  throwIfAmplifyErrors(errors);

  if (!data) {
    throw new Error("Project not found.");
  }

  return data;
}

function parseOrder(formData: FormData, key: string) {
  const raw = requiredString(formData, key);
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed) || parsed.some((value) => typeof value !== "string")) {
    throw new Error(`Invalid field: ${key}`);
  }

  return parsed;
}

export async function createProjectAction(formData: FormData) {
  await requireAuthenticatedUser();

  const { data: existingProjects, errors: listErrors } = await cookiesClient.models.Project.list();
  throwIfAmplifyErrors(listErrors);

  const nextSortOrder =
    Math.max(-1, ...(existingProjects ?? []).map((project) => project.sortOrder ?? -1)) + 1;

  const { data, errors } = await cookiesClient.models.Project.create({
    name: requiredString(formData, "name"),
    description: optionalString(formData, "description"),
    sortOrder: nextSortOrder,
    tone: "active",
  });

  throwIfAmplifyErrors(errors);
  revalidatePath("/");
  return { projectId: data?.id ?? null };
}

export async function createTaskAction(formData: FormData) {
  await requireAuthenticatedUser();

  const projectId = requiredString(formData, "projectId");
  await assertProjectAccess(projectId);

  const { data: existingTasks, errors: listErrors } = await cookiesClient.models.Task.list({
    filter: { projectId: { eq: projectId } },
  });
  throwIfAmplifyErrors(listErrors);

  const nextSortOrder =
    Math.max(-1, ...(existingTasks ?? []).map((task) => task.sortOrder ?? -1)) + 1;

  const { errors } = await cookiesClient.models.Task.create({
    title: requiredString(formData, "title"),
    note: optionalString(formData, "note"),
    dueDate: optionalString(formData, "dueDate"),
    sortOrder: nextSortOrder,
    done: false,
    projectId,
  });

  throwIfAmplifyErrors(errors);
  revalidatePath("/");
  return { projectId };
}

export async function toggleTaskAction(formData: FormData) {
  await requireAuthenticatedUser();

  const taskId = requiredString(formData, "taskId");
  const projectId = requiredString(formData, "projectId");
  const done = requiredString(formData, "done") === "true";

  const { errors } = await cookiesClient.models.Task.update({
    id: taskId,
    done: !done,
  });

  throwIfAmplifyErrors(errors);
  revalidatePath("/");
  return { projectId, taskId, done: !done };
}

export async function updateTaskAction(formData: FormData) {
  await requireAuthenticatedUser();

  const taskId = requiredString(formData, "taskId");
  const projectId = requiredString(formData, "projectId");
  await assertProjectAccess(projectId);

  const title = requiredString(formData, "title");
  const note = formData.get("note");
  const dueDate = formData.get("dueDate");

  const { errors } = await cookiesClient.models.Task.update({
    id: taskId,
    title,
    note: typeof note === "string" && note.trim().length > 0 ? note.trim() : null,
    dueDate:
      typeof dueDate === "string" && dueDate.trim().length > 0 ? dueDate.trim() : null,
  });

  throwIfAmplifyErrors(errors);
  revalidatePath("/");
  return { projectId, taskId };
}

export async function deleteTaskAction(formData: FormData) {
  await requireAuthenticatedUser();

  const taskId = requiredString(formData, "taskId");
  const projectId = requiredString(formData, "projectId");

  const { errors } = await cookiesClient.models.Task.delete({
    id: taskId,
  });

  throwIfAmplifyErrors(errors);
  revalidatePath("/");
  return { projectId, taskId };
}

export async function reorderTasksAction(formData: FormData) {
  await requireAuthenticatedUser();

  const projectId = requiredString(formData, "projectId");
  await assertProjectAccess(projectId);
  const orderedIds = parseOrder(formData, "orderedTaskIds");

  await Promise.all(
    orderedIds.map((taskId, index) =>
      cookiesClient.models.Task.update({
        id: taskId,
        sortOrder: index,
      }),
    ),
  );

  revalidatePath("/");
  return { projectId };
}

export async function archiveProjectAction(formData: FormData) {
  await requireAuthenticatedUser();

  const projectId = requiredString(formData, "projectId");
  const tone = requiredString(formData, "tone") as NonNullable<Project["tone"]>;

  const { errors } = await cookiesClient.models.Project.update({
    id: projectId,
    tone: tone === "done" ? "active" : "done",
  });

  throwIfAmplifyErrors(errors);
  revalidatePath("/");
  return { projectId, tone: tone === "done" ? "active" : "done" };
}

export async function updateProjectAction(formData: FormData) {
  await requireAuthenticatedUser();

  const projectId = requiredString(formData, "projectId");

  const { errors } = await cookiesClient.models.Project.update({
    id: projectId,
    name: requiredString(formData, "name"),
    description: optionalString(formData, "description") ?? null,
  });

  throwIfAmplifyErrors(errors);
  revalidatePath("/");
  return { projectId };
}

export async function reorderProjectsAction(formData: FormData) {
  await requireAuthenticatedUser();

  const orderedIds = parseOrder(formData, "orderedProjectIds");

  await Promise.all(
    orderedIds.map((projectId, index) =>
      cookiesClient.models.Project.update({
        id: projectId,
        sortOrder: index,
      }),
    ),
  );

  revalidatePath("/");
  return { projectId: orderedIds[0] ?? null };
}
