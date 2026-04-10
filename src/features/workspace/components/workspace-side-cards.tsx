import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { WorkspaceUser } from "@/features/workspace/types";

export function WorkspaceSideCards({ user }: { user: WorkspaceUser }) {
  return (
    <>
      <Card className="rounded-[1.6rem] border-stone-200/80 bg-[linear-gradient(180deg,_rgba(248,242,234,0.96),_rgba(244,238,229,0.94))] shadow-[0_18px_48px_-40px_rgba(15,23,42,0.18)]">
        <CardHeader>
          <CardTitle className="text-[1.25rem] font-semibold tracking-[-0.03em]">
            Current user
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-stone-600">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
              Username
            </div>
            <div className="mt-1 text-base font-medium text-stone-900">{user.username}</div>
          </div>
          <Separator />
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
              Login
            </div>
            <div className="mt-1 text-base font-medium text-stone-900">{user.loginId}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[1.6rem] border-stone-200/80 bg-[linear-gradient(180deg,_rgba(248,242,234,0.96),_rgba(244,238,229,0.94))] shadow-[0_18px_48px_-40px_rgba(15,23,42,0.18)] lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-[1.25rem] font-semibold tracking-[-0.03em]">
            Implementation notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-7 text-stone-600">
          <p>Task CRUD is now optimistic, so the board responds before the round-trip finishes.</p>
          <p>Project create, archive, and file upload expose loading states instead of silent waits.</p>
          <p>Server remains the source of truth, and each action ends with a refresh to reconcile state.</p>
        </CardContent>
      </Card>
    </>
  );
}
