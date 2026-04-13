"use client";

import { Amplify } from "aws-amplify";
import {
  CognitoAWSCredentialsAndIdentityIdProvider,
  DefaultIdentityIdStore,
  cognitoUserPoolsTokenProvider,
} from "aws-amplify/auth/cognito";
import { CookieStorage, parseAmplifyConfig } from "aws-amplify/utils";

import outputs from "../../amplify_outputs.json";

let isConfigured = false;

export function configureAmplifyClient() {
  if (isConfigured) {
    return;
  }

  const resolvedConfig = parseAmplifyConfig(outputs);
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:";
  const cookieStorage = new CookieStorage({
    sameSite: "lax",
    secure,
  });

  if (resolvedConfig.Auth) {
    cognitoUserPoolsTokenProvider.setAuthConfig(resolvedConfig.Auth);
    cognitoUserPoolsTokenProvider.setKeyValueStorage(cookieStorage);
  }

  Amplify.configure(outputs, {
    ssr: true,
    Auth: {
      tokenProvider: cognitoUserPoolsTokenProvider,
      credentialsProvider: new CognitoAWSCredentialsAndIdentityIdProvider(
        new DefaultIdentityIdStore(cookieStorage),
      ),
    },
  });

  isConfigured = true;
}
