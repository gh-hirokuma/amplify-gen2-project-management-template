"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { confirmSignUp, getCurrentUser, signUp } from "aws-amplify/auth";

import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SignupStage = "signup" | "confirm" | "done";

export function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [stage, setStage] = useState<SignupStage>("signup");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;

    async function redirectIfSignedIn() {
      try {
        await getCurrentUser();
        if (active) {
          router.replace("/");
        }
      } catch {
        // No current session.
      }
    }

    void redirectIfSignedIn();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      });

      if (result.nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        setStage("confirm");
        return;
      }

      setStage("done");
      router.replace("/login");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Sign up failed.",
      );
    } finally {
      setPending(false);
    }
  }

  async function handleConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      await confirmSignUp({
        username: email,
        confirmationCode,
      });

      setStage("done");
      router.replace("/login");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Confirmation failed.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Create account"
      title="自分の TODO を持つためのサインアップ"
      description="サインアップ後に確認コードを入力すると、Project と Task を自分のアカウント単位で持てます。"
      alternateHref="/login"
      alternateLabel="すでにアカウントがありますか？"
      alternateCta="ログインへ"
    >
      <Card className="border-white/80 bg-white/86 shadow-[0_36px_90px_-48px_rgba(15,23,42,0.5)] backdrop-blur">
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Step {stage === "confirm" ? "02" : "01"}
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
              {stage === "confirm" ? "確認コードを入力" : "アカウントを作成"}
            </h2>
            <p className="text-sm leading-7 text-slate-600">
              {stage === "confirm"
                ? `${email} に届いたコードを入力してください。`
                : "メールアドレスとパスワードで作成します。"}
            </p>
          </div>

          {stage === "signup" ? (
            <form className="space-y-5" onSubmit={handleSignUp}>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 chars, upper/lower/number/symbol"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
              <p className="text-xs leading-6 text-slate-500">
                Cognito password policy: uppercase, lowercase, number, symbol,
                minimum 8 characters.
              </p>
              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                  {error}
                </div>
              ) : null}
              <Button className="h-12 w-full" type="submit" disabled={pending}>
                {pending ? "Creating account..." : "Create account"}
              </Button>
            </form>
          ) : null}

          {stage === "confirm" ? (
            <form className="space-y-5" onSubmit={handleConfirm}>
              <div className="space-y-2">
                <Label htmlFor="confirmation-code">Confirmation code</Label>
                <Input
                  id="confirmation-code"
                  inputMode="numeric"
                  placeholder="123456"
                  value={confirmationCode}
                  onChange={(event) => setConfirmationCode(event.target.value)}
                  required
                />
              </div>
              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                  {error}
                </div>
              ) : null}
              <Button className="h-12 w-full" type="submit" disabled={pending}>
                {pending ? "Confirming..." : "Verify and continue"}
              </Button>
            </form>
          ) : null}

          {stage === "done" ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
              Account ready. Redirecting to login...
            </div>
          ) : null}

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 text-sm leading-7 text-slate-600">
            確認コードが届かない場合でも、画面を閉じずにそのまま待ってください。
            メールクライアントの迷惑メールも確認してください。
          </div>
          <Link
            className="inline-flex text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-950 hover:decoration-slate-950"
            href="/login"
          >
            ログインへ戻る
          </Link>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
