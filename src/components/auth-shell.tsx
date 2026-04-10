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
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_rgba(255,255,255,0)_36%),linear-gradient(140deg,_#efe4d3_0%,_#e7efe9_40%,_#d9e8f6_100%)] px-4 py-4 text-slate-950 sm:px-6 sm:py-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1520px] gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(520px,560px)]">
        <section className="relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded-[2.25rem] border border-white/70 bg-[linear-gradient(180deg,_rgba(255,255,255,0.92),_rgba(255,255,255,0.72))] p-7 shadow-[0_36px_120px_-56px_rgba(15,23,42,0.42)] backdrop-blur sm:p-10">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-16 top-8 h-40 w-40 rounded-full bg-[#f4ddbf]/55 blur-3xl" />
            <div className="absolute right-8 top-12 h-56 w-56 rounded-full bg-[#d7e5f5]/70 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-px w-40 bg-slate-400/30" />
            <div className="absolute bottom-10 right-12 h-28 w-28 rounded-full border border-slate-300/45" />
          </div>

          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_260px]">
            <div className="space-y-8">
              <div className="space-y-5">
                <span className="inline-flex w-fit rounded-full border border-slate-300/70 bg-[#0e1321] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.34em] text-[#f6e7c8] shadow-sm">
                  {eyebrow}
                </span>
                <div className="space-y-5">
                  <h1 className="max-w-4xl text-[3.35rem] leading-[0.96] tracking-[-0.06em] text-[#0f1729] sm:text-[5.2rem] xl:text-[6.2rem]">
                    {title}
                  </h1>
                  <p className="max-w-2xl text-lg leading-[1.85] text-slate-600">
                    {description}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:max-w-3xl">
                <div className="rounded-[1.75rem] border border-slate-200/80 bg-white/72 p-5 shadow-[0_16px_44px_-34px_rgba(15,23,42,0.35)] backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                    Auth
                  </p>
                  <p className="mt-3 text-[15px] leading-8 text-slate-700">
                    Cognito email login, confirmation code, current session restore.
                  </p>
                </div>
                <div className="rounded-[1.75rem] border border-slate-200/80 bg-white/72 p-5 shadow-[0_16px_44px_-34px_rgba(15,23,42,0.35)] backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                    Data
                  </p>
                  <p className="mt-3 text-[15px] leading-8 text-slate-700">
                    Project と Task は Amplify Data 経由で DynamoDB に保存されます。
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 self-start lg:pt-14">
              <div className="rounded-[1.75rem] border border-slate-200/70 bg-white/68 p-5 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Flow
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  Sign up, confirm email, return to your board. No Hosted UI detour.
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-slate-200/70 bg-[#121826] p-5 text-stone-100 shadow-[0_20px_50px_-36px_rgba(15,23,42,0.9)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#f0c98a]">
                  Server side
                </p>
                <p className="mt-3 text-sm leading-7 text-stone-300">
                  CRUD, file upload, signed URL generation, all routed through server actions and handlers.
                </p>
              </div>
            </div>
          </div>

          <div className="relative mt-10 flex flex-col gap-6 border-t border-slate-200/80 pt-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                Working style
              </p>
              <p className="mt-3 text-sm leading-8 text-slate-600">
                A quiet board for real work, not a noisy SaaS template. Fewer colors, tighter spacing, stronger hierarchy.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span>{alternateLabel}</span>
              <Link
                className="font-semibold text-slate-950 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-950"
                href={alternateHref}
              >
                {alternateCta}
              </Link>
            </div>
          </div>
        </section>

        <section className="flex">
          <div className="flex w-full flex-col rounded-[2.25rem] border border-white/70 bg-[linear-gradient(180deg,_rgba(255,255,255,0.94),_rgba(255,255,255,0.82))] p-3 shadow-[0_36px_120px_-56px_rgba(15,23,42,0.42)] backdrop-blur">
            <div className="flex-1 rounded-[1.85rem] border border-slate-200/70 bg-white/78 p-2 sm:p-3">
              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
