import { LogoutButton } from "@/components/logout-button";
import type { WorkspaceUser } from "@/features/workspace/types";

export function WorkspaceHeader({
  user,
  projectCount,
  openTaskCount,
}: {
  user: WorkspaceUser;
  projectCount: number;
  openTaskCount: number;
}) {
  return (
    <header className="overflow-hidden rounded-[1.85rem] bg-[linear-gradient(135deg,_#17130f_0%,_#201913_52%,_#2b221c_100%)] px-6 py-7 text-stone-50 shadow-[0_28px_72px_-44px_rgba(0,0,0,0.72)] sm:px-8 sm:py-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl space-y-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-300/90">
            Authenticated workspace
          </p>
          <div className="space-y-3">
            <div className="text-sm leading-7 text-stone-300 sm:text-base">{user.loginId}</div>
            <h1 className="max-w-2xl text-[2.4rem] font-semibold leading-[0.94] tracking-[-0.06em] text-stone-50 sm:text-[4.4rem]">
              PROJECT DASHBOARD
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-stone-300 sm:text-[15px]">
              ログイン UI は custom form のままにしつつ、Data、Storage、署名 URL の処理は
              Next.js App Router の server component / server action / route handler で実行します。
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 backdrop-blur">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
              Active projects
            </div>
            <div className="mt-1 text-2xl font-semibold">{projectCount}</div>
          </div>
          <div className="rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 backdrop-blur">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
              Open tasks
            </div>
            <div className="mt-1 text-2xl font-semibold">{openTaskCount}</div>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
