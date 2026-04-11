import type { FormEvent, RefObject } from "react";

import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SpinnerLabel } from "@/features/workspace/components/spinner-label";
import type { StoredFile } from "@/features/workspace/types";
import { getDisplayFileName } from "@/lib/project-files";

function formatFileMeta(file: StoredFile) {
  const updatedAt = file.lastModified
    ? new Date(file.lastModified).toLocaleString("ja-JP")
    : file.uploading
      ? "Uploading..."
      : "Uploaded just now";
  const size =
    typeof file.size === "number"
      ? `${Math.max(1, Math.round(file.size / 1024))} KB`
      : file.uploading
        ? "Preparing file"
        : "Size unknown";

  return `${updatedAt} · ${size}`;
}

export function ProjectFilesPanel({
  selectedProjectId,
  files,
  uploadError,
  isUploadingFile,
  openingFilePath,
  uploadFormRef,
  onUploadFile,
  onOpenFile,
}: {
  selectedProjectId: string | null;
  files: StoredFile[];
  uploadError: string | null;
  isUploadingFile: boolean;
  openingFilePath: string | null;
  uploadFormRef: RefObject<HTMLFormElement | null>;
  onUploadFile: (event: FormEvent<HTMLFormElement>) => void;
  onOpenFile: (path: string) => void;
}) {
  return (
    <Card className="rounded-[1.6rem] border-stone-200/80 bg-[linear-gradient(180deg,_rgba(248,242,234,0.96),_rgba(244,238,229,0.94))] shadow-[0_18px_48px_-40px_rgba(15,23,42,0.18)] lg:col-span-2">
      <CardHeader className="space-y-3">
        <CardTitle className="text-[1.25rem] font-semibold tracking-[-0.03em]">
          Project files
        </CardTitle>
        <p className="text-sm leading-7 text-stone-600">
          アップロードも署名 URL 取得も Server Action で処理します。API Route は使いません。
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <form
          ref={uploadFormRef}
          className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]"
          onSubmit={onUploadFile}
        >
          <input name="projectId" type="hidden" value={selectedProjectId ?? ""} />
          <div className="space-y-2">
            <Label htmlFor="project-file">Upload file</Label>
            <Input
              id="project-file"
              name="file"
              type="file"
              disabled={!selectedProjectId || isUploadingFile}
            />
          </div>
          <div className="flex items-end">
            <Button
              className="h-11 w-full md:w-auto"
              type="submit"
              disabled={!selectedProjectId || isUploadingFile}
            >
              <SpinnerLabel
                pending={isUploadingFile}
                idle="Upload to S3"
                busy="Uploading..."
              />
            </Button>
          </div>
        </form>

        {uploadError ? (
          <div className="rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {uploadError}
          </div>
        ) : null}

        <div className="space-y-3">
          {!selectedProjectId ? (
            <div className="rounded-[1.2rem] border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-sm leading-7 text-stone-500">
              Project を選ぶと、この Project 専用のファイルを S3 に追加できます。
            </div>
          ) : null}

          {selectedProjectId && files.length === 0 ? (
            <div className="rounded-[1.2rem] border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-sm leading-7 text-stone-500">
              まだファイルがありません。最初の 1 件を S3 へアップロードしてください。
            </div>
          ) : null}

          {files.map((file) => (
            <div
              key={file.path}
              className={`grid gap-3 rounded-[1.2rem] border border-stone-200 bg-white/90 px-4 py-4 transition sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center ${
                file.uploading ? "opacity-70" : "opacity-100"
              }`}
            >
              <div className="min-w-0 space-y-1.5">
                <div className="truncate text-base font-semibold tracking-[-0.01em] text-stone-900">
                  {getDisplayFileName(file.path)}
                </div>
                <div className="text-sm leading-6 text-stone-600">{formatFileMeta(file)}</div>
              </div>
              {file.uploading ? (
                <div className="inline-flex items-center gap-2 text-sm text-stone-500">
                  <LoaderCircle className="size-4 animate-spin" />
                  Preparing URL...
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  disabled={openingFilePath === file.path}
                  onClick={() => onOpenFile(file.path)}
                >
                  <SpinnerLabel
                    pending={openingFilePath === file.path}
                    idle="Open signed URL"
                    busy="Opening..."
                  />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
