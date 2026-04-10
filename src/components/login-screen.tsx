"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, signIn } from "aws-amplify/auth";

import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        // No active session yet.
      }
    }

    void redirectIfSignedIn();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const result = await signIn({
        username: email,
        password,
      });

      if (result.nextStep.signInStep !== "DONE") {
        setError(`Unsupported sign-in step: ${result.nextStep.signInStep}`);
        return;
      }

      window.location.assign("/");
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Sign in failed.";
      setError(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Sign in"
      title="Project と Task を自分の仕事として持つ"
      description="サインインすると、自分だけの Project ボードと Task リストを DynamoDB に保存できます。"
      alternateHref="/signup"
      alternateLabel="まだアカウントがありませんか？"
      alternateCta="サインアップへ"
    >
      <Card className="border-white/80 bg-white/86 shadow-[0_36px_90px_-48px_rgba(15,23,42,0.5)] backdrop-blur">
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Existing account
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
              Welcome back
            </h2>
            <p className="text-sm leading-7 text-slate-600">
              認証が通ると、保存済みの Project と Task がこの端末に同期されます。
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                {error}
              </div>
            ) : null}

            <Button className="h-12 w-full" type="submit" disabled={pending}>
              {pending ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4 text-sm leading-7 text-slate-600">
            確認コード入力が済んでいない場合は、先にサインアップ画面で登録を完了してください。
          </div>
          <Link
            className="inline-flex text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-950 hover:decoration-slate-950"
            href="/signup"
          >
            新規登録へ進む
          </Link>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
