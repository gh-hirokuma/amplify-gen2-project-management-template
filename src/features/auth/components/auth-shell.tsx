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
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.88),_rgba(255,255,255,0)_28%),linear-gradient(180deg,_#f5efe5_0%,_#eef2ef_44%,_#e5edf6_100%)] px-4 py-4 text-slate-950 sm:px-6 sm:py-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1500px] gap-4 xl:grid-cols-[minmax(0,1.12fr)_minmax(520px,560px)]">
        <section className="relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded-[1.9rem] border border-white/70 bg-[linear-gradient(180deg,_rgba(255,255,255,0.9),_rgba(255,255,255,0.78))] p-6 shadow-[0_28px_90px_-52px_rgba(15,23,42,0.34)] backdrop-blur sm:p-9">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-16 top-8 h-40 w-40 rounded-full bg-[#efd8bb]/40 blur-3xl" />
            <div className="absolute right-8 top-12 h-56 w-56 rounded-full bg-[#d9e5f2]/55 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-px w-40 bg-slate-400/25" />
            <div className="absolute bottom-8 right-10 h-24 w-24 rounded-full border border-slate-300/35" />
          </div>

          <div className="relative grid gap-9 lg:grid-cols-[minmax(0,1.05fr)_280px]">
            <div className="space-y-7">
              <div className="space-y-5">
                <span className="inline-flex w-fit rounded-full border border-slate-300/70 bg-[#111827] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#f4ddbf] shadow-sm">
                  {eyebrow}
                </span>
                <div className="space-y-4">
                  <h1 className="max-w-4xl text-[2.9rem] font-semibold leading-[0.96] tracking-[-0.055em] text-[#0f1729] sm:text-[4.25rem] xl:text-[5rem]">
                    {title}
                  </h1>
                  <p className="max-w-2xl text-[17px] leading-8 text-slate-600">
                    {description}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:max-w-3xl">
                <div className="rounded-[1.35rem] border border-slate-200/85 bg-white/78 p-5 shadow-[0_16px_36px_-30px_rgba(15,23,42,0.18)] backdrop-blur">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Auth
                  </p>
                  <p className="mt-3 text-[15px] leading-7 text-slate-700">
                    Cognito email login, confirmation code, current session restore.
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-slate-200/85 bg-white/78 p-5 shadow-[0_16px_36px_-30px_rgba(15,23,42,0.18)] backdrop-blur">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Data
                  </p>
                  <p className="mt-3 text-[15px] leading-7 text-slate-700">
                    Project と Task は Amplify Data 経由で DynamoDB に保存されます。
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 self-start lg:pt-10">
              <div className="rounded-[1.35rem] border border-slate-200/75 bg-white/72 p-5 backdrop-blur">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Flow
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-700">
                  Sign up, confirm email, return to your board. No Hosted UI detour.
                </p>
              </div>
              <div className="rounded-[1.35rem] border border-slate-200/70 bg-[#111827] p-5 text-stone-100 shadow-[0_20px_44px_-34px_rgba(15,23,42,0.6)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#f0c98a]">
                  Server side
                </p>
                <p className="mt-3 text-sm leading-7 text-stone-300">
                  CRUD, file upload, signed URL generation, all routed through server actions and handlers.
                </p>
              </div>
            </div>
          </div>

          <div className="relative mt-9 flex flex-col gap-6 border-t border-slate-200/80 pt-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Working style
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
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
          <div className="flex w-full flex-col rounded-[1.9rem] border border-white/70 bg-[linear-gradient(180deg,_rgba(255,255,255,0.94),_rgba(255,255,255,0.84))] p-3 shadow-[0_28px_90px_-52px_rgba(15,23,42,0.34)] backdrop-blur">
            <div className="flex-1 rounded-[1.5rem] border border-slate-200/70 bg-white/82 p-2 sm:p-3">
              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
