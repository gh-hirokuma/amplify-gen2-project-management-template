import { LoaderCircle } from "lucide-react";

export function SpinnerLabel({
  pending,
  idle,
  busy,
}: {
  pending: boolean;
  idle: string;
  busy: string;
}) {
  return pending ? (
    <span className="inline-flex items-center gap-2">
      <LoaderCircle className="size-4 animate-spin" />
      {busy}
    </span>
  ) : (
    <span>{idle}</span>
  );
}
