import { createHash } from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { fetchAuthSession } from "aws-amplify/auth/server";

import outputs from "../../../../amplify_outputs.json";
import { runWithAmplifyServerContext } from "@/server/amplify";

type JwtPayload = {
  exp?: number;
  iat?: number;
  jti?: string;
  origin_jti?: string;
};

function decodeJwtPayload(token?: string): JwtPayload | null {
  if (!token) {
    return null;
  }

  const [, payload] = token.split(".");

  if (!payload) {
    return null;
  }

  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  try {
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as JwtPayload;
  } catch {
    return null;
  }
}

function hashToken(value?: string) {
  if (!value) {
    return null;
  }

  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function toIso(value?: number) {
  return typeof value === "number" ? new Date(value * 1000).toISOString() : null;
}

export async function debugCurrentSession() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const clientId = outputs.auth.user_pool_client_id;
  const clientCookies = allCookies.filter((cookie) => cookie.name.includes(clientId));
  const cookieBySuffix = (suffix: string) =>
    clientCookies.find((cookie) => cookie.name.endsWith(suffix))?.value;

  try {
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => fetchAuthSession(contextSpec),
    });

    const accessToken = session.tokens?.accessToken?.toString();
    const idToken = session.tokens?.idToken?.toString();
    const refreshTokenHash = hashToken(cookieBySuffix(".refreshToken"));

    if (!accessToken || !idToken) {
      return NextResponse.json(
        {
          error: "Unauthenticated request.",
          now: new Date().toISOString(),
          userPoolClientId: clientId,
          cookieHashes: {
            accessToken: hashToken(cookieBySuffix(".accessToken")),
            idToken: hashToken(cookieBySuffix(".idToken")),
            refreshToken: refreshTokenHash,
          },
          cookieNames: clientCookies.map((cookie) => cookie.name),
        },
        { status: 401 },
      );
    }

    const accessPayload = decodeJwtPayload(accessToken);
    const idPayload = decodeJwtPayload(idToken);
    const now = Math.floor(Date.now() / 1000);

    return NextResponse.json({
      now: new Date().toISOString(),
      userPoolClientId: clientId,
      accessToken: {
        hash: hashToken(accessToken),
        expiresAt: toIso(accessPayload?.exp),
        issuedAt: toIso(accessPayload?.iat),
        secondsRemaining: typeof accessPayload?.exp === "number" ? accessPayload.exp - now : null,
        jti: accessPayload?.jti ?? null,
        originJti: accessPayload?.origin_jti ?? null,
      },
      idToken: {
        hash: hashToken(idToken),
        expiresAt: toIso(idPayload?.exp),
        issuedAt: toIso(idPayload?.iat),
        secondsRemaining: typeof idPayload?.exp === "number" ? idPayload.exp - now : null,
        jti: idPayload?.jti ?? null,
        originJti: idPayload?.origin_jti ?? null,
      },
      cookieHashes: {
        accessToken: hashToken(cookieBySuffix(".accessToken")),
        idToken: hashToken(cookieBySuffix(".idToken")),
        refreshToken: refreshTokenHash,
      },
      cookieNames: clientCookies.map((cookie) => cookie.name),
      notes: [
        "Wait at least 6 minutes after sign-in, then refresh this endpoint.",
        "If backend refresh works, access/id token expiresAt and jti should change.",
        "With refresh rotation enabled, refreshToken hash should also change while originJti stays stable.",
      ],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to inspect session.";

    return NextResponse.json(
      {
        error: message,
        now: new Date().toISOString(),
        userPoolClientId: clientId,
        cookieHashes: {
          accessToken: hashToken(cookieBySuffix(".accessToken")),
          idToken: hashToken(cookieBySuffix(".idToken")),
          refreshToken: hashToken(cookieBySuffix(".refreshToken")),
        },
        cookieNames: clientCookies.map((cookie) => cookie.name),
      },
      { status: 401 },
    );
  }
}
