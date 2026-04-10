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

export async function createProjectAction(formData: FormData) {
  await requireAuthenticatedUser();

  const { data, errors } = await cookiesClient.models.Project.create({
    name: requiredString(formData, "name"),
    description: optionalString(formData, "description"),
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

  const { errors } = await cookiesClient.models.Task.create({
    title: requiredString(formData, "title"),
    note: optionalString(formData, "note"),
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
