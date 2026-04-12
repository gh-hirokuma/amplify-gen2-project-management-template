import { cookies } from "next/headers";

import { createServerRunner } from "@aws-amplify/adapter-nextjs";
import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/api";
import { getCurrentUser } from "aws-amplify/auth/server";

import type { Schema } from "@backend/data/resource";

import outputs from "../../amplify_outputs.json";

export const { runWithAmplifyServerContext } = createServerRunner({
  config: outputs,
});

export const cookiesClient = generateServerClientUsingCookies<Schema>({
  config: outputs,
  cookies,
});

export async function getCurrentUserOrNull() {
  return runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (contextSpec) => {
      try {
        return await getCurrentUser(contextSpec);
      } catch {
        return null;
      }
    },
  });
}

export function isUnauthenticatedError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "UserUnAuthenticatedException" ||
    error.message === "Unauthorized" ||
    error.message.includes("User needs to be authenticated") ||
    error.message.includes("No current user") ||
    error.message.includes("Unauthenticated request")
  );
}

export async function getAuthenticatedUser() {
  const user = await getCurrentUserOrNull();

  if (!user) {
    throw new Error("Unauthenticated request.");
  }

  return user;
}
