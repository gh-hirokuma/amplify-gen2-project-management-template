"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { cookiesClient, getCurrentUserOrNull } from "./amplify-server-utils";

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

function requiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing field: ${key}`);
  }

  return value.trim();
}

function optionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

async function requireAuthenticatedUser() {
  const user = await getCurrentUserOrNull();

  if (!user) {
    redirect("/login");
  }

  return user;
}

async function assertProjectAccess(projectId: string) {
  const { data, errors } = await cookiesClient.models.Project.get({ id: projectId });
  presentErrors(errors);

  if (!data) {
    throw new Error("Project not found.");
  }

  return data;
}

export async function createProjectAction(formData: FormData) {
  await requireAuthenticatedUser();

  const { data, errors } = await cookiesClient.models.Project.create({
    name: requiredString(formData, "name"),
    description: optionalString(formData, "description"),
    tone: "active",
  });

  presentErrors(errors);
  revalidatePath("/");
  return { projectId: data?.id ?? null };
}

export async function createTaskAction(formData: FormData) {
  await requireAuthenticatedUser();

  const projectId = requiredString(formData, "projectId");
  await assertProjectAccess(projectId);

  const { errors } = await cookiesClient.models.Task.create({
    title: requiredString(formData, "title"),
    note: optionalString(formData, "note"),
    done: false,
    projectId,
  });

  presentErrors(errors);
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

  presentErrors(errors);
  revalidatePath("/");
  return { projectId, taskId, done: !done };
}

export async function deleteTaskAction(formData: FormData) {
  await requireAuthenticatedUser();

  const taskId = requiredString(formData, "taskId");
  const projectId = requiredString(formData, "projectId");

  const { errors } = await cookiesClient.models.Task.delete({
    id: taskId,
  });

  presentErrors(errors);
  revalidatePath("/");
  return { projectId, taskId };
}

export async function archiveProjectAction(formData: FormData) {
  await requireAuthenticatedUser();

  const projectId = requiredString(formData, "projectId");
  const tone = requiredString(formData, "tone");

  const { errors } = await cookiesClient.models.Project.update({
    id: projectId,
    tone: tone === "done" ? "active" : "done",
  });

  presentErrors(errors);
  revalidatePath("/");
  return { projectId, tone: tone === "done" ? "active" : "done" };
}
