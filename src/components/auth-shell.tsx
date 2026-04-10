import Link from "next/link";
import { ReactNode } from "react";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  alternateHref: string;
  alternateLabel: string;
  alternateCta: string;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  alternateHref,
  alternateLabel,
  alternateCta,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[linear-gradient(160deg,_#f6f2e8_0%,_#edf4f7_48%,_#dbeafe_100%)] px-5 py-8 text-slate-950 sm:px-8 sm:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-8 lg:grid-cols-[1.15fr_460px]">
        <section className="flex flex-col justify-between rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,_rgba(255,255,255,0.86),_rgba(255,255,255,0.68))] p-7 shadow-[0_32px_80px_-50px_rgba(15,23,42,0.45)] backdrop-blur sm:p-10">
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="inline-flex w-fit rounded-full border border-slate-300/80 bg-slate-950 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-amber-100">
                {eyebrow}
              </span>
              <div className="space-y-4">
                <h1 className="max-w-2xl font-heading text-4xl leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-6xl">
                  {title}
                </h1>
                <p className="max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                  {description}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Auth
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  Cognito email login, confirmation code, current session restore.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Data
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  Project と Task は Amplify Data 経由で DynamoDB に保存されます。
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span>{alternateLabel}</span>
            <Link
              className="font-semibold text-slate-950 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-950"
              href={alternateHref}
            >
              {alternateCta}
            </Link>
          </div>
        </section>

        {children}
      </div>
    </main>
  );
}
