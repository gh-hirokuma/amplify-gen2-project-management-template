import { cookies } from "next/headers";

import { createServerRunner } from "@aws-amplify/adapter-nextjs";
import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/api";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth/server";

import type { Schema } from "@backend/data/resource";

import outputs from "../../../amplify_outputs.json";

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
        const [user, session] = await Promise.all([
          getCurrentUser(contextSpec),
          fetchAuthSession(contextSpec),
        ]);

        if (!session.tokens?.accessToken || !session.tokens?.idToken) {
          return null;
        }

        return user;
      } catch {
        return null;
      }
    },
  });
}

export async function getAuthenticatedUser() {
  const user = await getCurrentUserOrNull();

  if (!user) {
    throw new Error("Unauthenticated request.");
  }

  return user;
}
