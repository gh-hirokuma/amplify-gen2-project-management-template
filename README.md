# Amplify Project Board

An opinionated reference app for building authenticated Next.js products on top of Amplify Gen 2.

It ships a complete vertical slice:

- Cognito authentication with in-app `Authenticator`
- server-rendered App Router pages
- Amplify Data models backed by DynamoDB
- S3 file upload
- signed URL generation behind authenticated server routes
- optimistic UI for day-to-day task operations

The codebase is intentionally organized so a junior engineer can copy an existing feature slice and extend it without inventing a new structure.

## Why This Repo Exists

Most demo apps stop at “it works.”  
This one is optimized for “a team can keep shipping on top of it.”

That means:

- feature-first folder structure
- thin route handlers and thin app entrypoints
- server reads and server writes separated cleanly
- shared auth/error/form primitives
- optimistic UI kept in one predictable place

## Stack

- [Next.js 16](https://nextjs.org/)
- [React 19](https://react.dev/)
- [Amplify Gen 2](https://docs.amplify.aws/)
- [Cognito](https://aws.amazon.com/cognito/)
- [Amplify Data](https://docs.amplify.aws/react/build-a-backend/data/)
- [DynamoDB](https://aws.amazon.com/dynamodb/)
- [S3](https://aws.amazon.com/s3/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS 4](https://tailwindcss.com/)

## Product Surface

- `/login`
  - email/password sign-in
- `/signup`
  - account creation and confirmation flow
- `/`
  - authenticated project and task dashboard
- `/api/files/upload`
  - authenticated S3 upload route
- `/api/files/open`
  - authenticated signed URL redirect route
- `/api/auth/session-debug`
  - token refresh inspection route for local verification

## Architecture

The repo uses a strict feature-slice shape:

```text
src/
  app/                 # route entrypoints only
  components/ui/       # reusable design primitives
  features/
    auth/
    workspace/
  lib/                 # pure helpers
  server/              # shared server-only primitives
```

The main request flow is:

```text
app/page.tsx
  -> feature page (server component)
  -> server loader
  -> interactive client shell
  -> server actions / route helpers
```

Deeper notes live in [docs/architecture.md](/Users/hiroshige.negishi/Documents/Amplify/amplify-playground/docs/architecture.md).

## Quick Start

### 1. Install

```bash
npm install
```

### 2. Start the Amplify sandbox

```bash
npm run sandbox
```

### 3. Start the app

```bash
npm run dev
```

Open [http://localhost:5555](http://localhost:5555).

## Scripts

```bash
npm run dev       # start local app on port 5555
npm run build     # production build
npm run start     # run production build on port 5555
npm run lint      # lint the project
npm run sandbox   # run Amplify Gen 2 sandbox
npm run ampx      # raw ampx passthrough
```

## Auth and Session Model

- access token: short-lived
- refresh token: longer-lived
- refresh rotation: enabled
- page protection: enforced in `proxy.ts`
- server session reads: handled through shared Amplify server helpers

The app is designed so protected reads and writes happen server-side.  
Client components coordinate interaction and optimism, but the server remains the source of truth.

## Feature Development

When adding a new feature, do not invent a new shape. Copy an existing slice.

Start here:

- [docs/feature-playbook.md](/Users/hiroshige.negishi/Documents/Amplify/amplify-playground/docs/feature-playbook.md)
- [docs/runtime-flow.md](/Users/hiroshige.negishi/Documents/Amplify/amplify-playground/docs/runtime-flow.md)

The current reference implementation is:

- [src/features/auth](/Users/hiroshige.negishi/Documents/Amplify/amplify-playground/src/features/auth)
- [src/features/workspace](/Users/hiroshige.negishi/Documents/Amplify/amplify-playground/src/features/workspace)

## Verification

Recommended local checks:

```bash
npm run lint
npm run build
node --import tsx --test src/lib/project-files.test.ts src/lib/selected-project.test.ts
```

## Documentation

- [docs/architecture.md](/Users/hiroshige.negishi/Documents/Amplify/amplify-playground/docs/architecture.md)
- [docs/feature-playbook.md](/Users/hiroshige.negishi/Documents/Amplify/amplify-playground/docs/feature-playbook.md)
- [docs/runtime-flow.md](/Users/hiroshige.negishi/Documents/Amplify/amplify-playground/docs/runtime-flow.md)

## References

- [Amplify SSR](https://docs.amplify.aws/nextjs/frontend/server-side-rendering/)
- [Amplify Next.js App Router Server Components](https://docs.amplify.aws/nextjs/frontend/server-side-rendering/nextjs-app-router-server-components/)
- [Next.js Proxy File Convention](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
