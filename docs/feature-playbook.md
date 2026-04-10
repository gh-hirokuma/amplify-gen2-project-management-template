# Feature Playbook

## Goal

This is the “copy this, then rename things” guide.

If you are adding a new feature, follow this order.

## 1. Create the Slice

```text
src/features/<feature-name>/
  components/
  server/
  types.ts
  index.ts
```

Use [src/features/workspace](/Users/hiroshige.negishi/Documents/Amplify/amplify-playground/src/features/workspace) as the default template.

## 2. Start With Types

Create `types.ts` first.

Put here:

- serializable UI-facing shapes
- feature-local view models
- payload shapes shared by the feature

Do not put:

- Amplify infrastructure helpers
- generic utility types for the whole app

## 3. Add the Loader

Create `server/load-<feature>-data.ts`.

The loader should:

- authenticate if needed
- read from Amplify or other backend services
- sort/filter/shape data
- return serializable values only

The loader should not:

- return raw framework objects
- mix in client-only formatting state

## 4. Add the Page Entry

Create `components/<feature>-page.tsx`.

This file should be thin:

```tsx
export async function FeaturePage() {
  const data = await loadFeatureData();
  return <FeatureInteractive {...data} />;
}
```

That is the bar.

## 5. Add the Interactive Shell

Create `components/<feature>-interactive.tsx`.

This file owns:

- `useTransition`
- `useOptimistic`
- local error state
- local pending state
- orchestration of server actions and refreshes

This file should not:

- fetch server data directly
- create global auth clients

## 6. Add Server Actions

Create `server/<feature>-actions.ts`.

Each action should:

- validate input
- confirm auth
- perform one mutation
- revalidate or refresh the affected path
- return a minimal result

Keep actions boring. That is a feature, not a bug.

## 7. Add Route Helpers Only When Needed

Create `server/<feature>-routes.ts` only if:

- a `route.ts` needs nontrivial logic
- file upload/download is involved
- redirect or streaming behavior belongs outside a server action

Then keep `app/api/.../route.ts` tiny and forward into the helper.

## 8. Wire the Route

Only after the feature slice exists should you wire:

- `src/app/page.tsx`
- `src/app/<route>/page.tsx`
- `src/app/api/<route>/route.ts`

Those files are adapters, not homes for logic.

## Mutation Checklist

Before shipping a new mutation, check all of these:

- input parsing goes through shared helpers
- auth is enforced
- backend errors are normalized
- optimistic updates are inside `startTransition(...)`
- refresh path is explicit
- failure path restores server truth

## Review Checklist

If a reviewer opens your feature, they should see:

- one clear loader
- one clear interactive shell
- one clear actions file
- tiny route entrypoints
- no mystery logic hiding in `app/*`

If they cannot predict where a read or write lives, the feature is too messy.
