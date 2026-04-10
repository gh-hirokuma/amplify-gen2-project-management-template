Authenticated project/task board built with Next.js 16, shadcn/ui, and Amplify Gen 2.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:5555](http://localhost:5555).

## Feature Structure

- `src/features/auth`
- `src/features/workspace`
- `src/server/*` for shared server-side primitives
- `src/lib/*` for pure helpers only

The canonical copy-paste pattern for adding a new feature lives in `ARCHITECTURE.md`.

## Checks

```bash
npm run lint
npm run build
```

## Backend

- `npm run sandbox` updates the Amplify Gen 2 sandbox
- Cognito handles authentication
- Amplify Data stores `Project` and `Task`
- S3 stores project files
- Signed URLs are issued server-side

## References

- [Amplify SSR](https://docs.amplify.aws/nextjs/frontend/server-side-rendering/)
- [Amplify Next.js App Router Server Components](https://docs.amplify.aws/nextjs/frontend/server-side-rendering/nextjs-app-router-server-components/)
