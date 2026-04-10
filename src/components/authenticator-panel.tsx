"use client";

import "@/lib/amplify-client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";

import { AuthShell } from "@/components/auth-shell";
import { Card, CardContent } from "@/components/ui/card";

type AuthenticatorPanelProps = {
  mode: "login" | "signup";
};

function AuthenticatorFlow({ mode }: AuthenticatorPanelProps) {
  const router = useRouter();
  const { user } = useAuthenticator((context) => [context.user]);

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [router, user]);

  return (
    <Authenticator
      className="amplify-auth-panel"
      hideSignUp={mode === "login"}
      initialState={mode === "signup" ? "signUp" : "signIn"}
      loginMechanisms={["email"]}
      signUpAttributes={["email"]}
      formFields={{
        signIn: {
          username: {
            label: "Email",
            placeholder: "you@example.com",
            isRequired: true,
          },
          password: {
            label: "Password",
            placeholder: "Enter your password",
            isRequired: true,
          },
        },
        signUp: {
          email: {
            order: 1,
            label: "Email",
            placeholder: "you@example.com",
            isRequired: true,
          },
          password: {
            order: 2,
            label: "Password",
            placeholder: "At least 8 chars, upper/lower/number/symbol",
            isRequired: true,
          },
          confirm_password: {
            order: 3,
            label: "Confirm password",
            placeholder: "Type your password again",
            isRequired: true,
          },
        },
        confirmSignUp: {
          confirmation_code: {
            label: "Confirmation code",
            placeholder: "123456",
            isRequired: true,
          },
        },
        forgotPassword: {
          username: {
            label: "Email",
            placeholder: "you@example.com",
            isRequired: true,
          },
        },
        confirmResetPassword: {
          confirmation_code: {
            label: "Confirmation code",
            placeholder: "123456",
            isRequired: true,
          },
          password: {
            label: "New password",
            placeholder: "Create a new password",
            isRequired: true,
          },
          confirm_password: {
            label: "Confirm password",
            placeholder: "Type your password again",
            isRequired: true,
          },
        },
      }}
    />
  );
}

export function AuthenticatorPanel({ mode }: AuthenticatorPanelProps) {
  const isSignup = mode === "signup";

  return (
    <AuthShell
      eyebrow={isSignup ? "Create account" : "Sign in"}
      title={
        isSignup
          ? "自分の TODO を持つためのサインアップ"
          : "Project と Task を自分の仕事として持つ"
      }
      description={
        isSignup
          ? "メール確認まで終えると、Project と Task を自分のアカウント単位で持てます。"
          : "サインインすると、自分だけの Project ボードと Task リストを DynamoDB に保存できます。"
      }
      alternateHref={isSignup ? "/login" : "/signup"}
      alternateLabel={
        isSignup
          ? "すでにアカウントがありますか？"
          : "まだアカウントがありませんか？"
      }
      alternateCta={isSignup ? "ログインへ" : "サインアップへ"}
    >
      <Card className="h-full border-0 bg-transparent shadow-none">
        <CardContent className="flex h-full flex-col space-y-6 p-5 sm:p-7">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
              {isSignup ? "Account setup" : "Existing account"}
            </p>
            <h2 className="text-4xl tracking-[-0.05em] text-slate-950">
              {isSignup ? "メール確認までここで完結" : "Welcome back"}
            </h2>
            <p className="max-w-lg text-[15px] leading-8 text-slate-600">
              Hosted UI は使わず、アプリ内の Authenticator UI で認証します。ログイン後の
              Data / Storage / signed URL は引き続き server-side で処理されます。
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200/80 bg-white/92 p-4 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.34)] sm:p-5">
            <Authenticator.Provider>
              <AuthenticatorFlow mode={mode} />
            </Authenticator.Provider>
          </div>

          <div className="rounded-[1.6rem] border border-slate-200/80 bg-[linear-gradient(180deg,_rgba(246,248,251,0.96),_rgba(241,244,248,0.82))] p-4 text-sm leading-8 text-slate-600">
            {isSignup
              ? "確認コードが届かない場合は迷惑メールを確認してください。登録済みの場合はログイン画面からそのままサインインできます。"
              : "確認コード入力が済んでいない場合は、サインアップ画面から登録を完了してください。"}
          </div>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
