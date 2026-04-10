# Architecture

## Goal

このリポジトリは「1 機能をそのまま真似して増やせること」を最優先にしています。  
新機能を足すときは、まず `src/features/*` に同じ断面を作ります。

## Standard Feature Shape

```text
src/features/<feature-name>/
  components/
    <feature>-page.tsx          # server component entry
    <feature>-interactive.tsx   # client state / optimistic UI
    ...small presentational parts
  server/
    load-<feature>-data.ts      # server-side read path
    <feature>-actions.ts        # server actions
    <feature>-routes.ts         # route handler helpers when needed
  types.ts
  index.ts
```

## Shared Layers

```text
src/server/amplify.ts          # Cognito session + Amplify server client
src/server/amplify-errors.ts   # Amplify model/query error normalization
src/server/form-data.ts        # common FormData parsing
src/lib/*                      # pure helpers only
```

`src/server/*` は「どの feature からも使う共通基盤」だけに絞ります。  
業務ルールは feature 側へ置きます。

## Request Flow

1. `app/*/page.tsx`
2. `features/*/components/*-page.tsx`
3. `features/*/server/load-*.ts`
4. `features/*/components/*-interactive.tsx`
5. `features/*/server/*-actions.ts` or `features/*/server/*-routes.ts`

これで「どこで読むか」「どこで書くか」「どこで UI 状態を持つか」が固定されます。

## Current Reference Features

- `src/features/auth`
  - Authenticator UI、login/signup 画面、session debug route helper
- `src/features/workspace`
  - dashboard、project/task/file 操作、optimistic UI、server reads/writes

## Rules For New Features

1. `page.tsx` には分岐を書かない
2. サーバ読み込みは `load-*.ts` に閉じる
3. 書き込みは `*-actions.ts` か `*-routes.ts` に閉じる
4. `*-interactive.tsx` だけが `useTransition` と `useOptimistic` を持つ
5. optimistic update は必ず `startTransition(...)` 内で行う
6. Amplify の `errors` 配列は毎回 `throwIfAmplifyErrors(...)` で処理する
7. `FormData` の必須/任意文字列は `requiredString` / `optionalString` を使う

## Copy-Paste Playbook

新しい feature を増やすときは、まず `src/features/workspace` を丸ごと見本にします。

- 表示だけなら `load-workspace-data.ts` と `workspace-page.tsx` を真似する
- mutation があるなら `workspace-actions.ts` を真似する
- optimistic UI があるなら `workspace-interactive.tsx` を真似する
- API route があるなら `project-file-routes.ts` を真似して `app/api/*/route.ts` は薄く保つ
