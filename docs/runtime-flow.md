# Runtime Flow

## End-to-End Flow

This document explains how the app behaves at runtime.

## Authentication

1. The browser loads `/login` or `/signup`
2. [src/components/configure-amplify.tsx](/Users/hiroshige.negishi/Documents/Amplify/amplify-playground/src/components/configure-amplify.tsx) initializes Amplify on the client
3. [src/features/auth/components/authenticator-panel.tsx](/Users/hiroshige.negishi/Documents/Amplify/amplify-playground/src/features/auth/components/authenticator-panel.tsx) renders the in-app Cognito flow
4. Cognito session cookies are stored for SSR usage
5. [proxy.ts](/Users/hiroshige.negishi/Documents/Amplify/amplify-playground/proxy.ts) protects authenticated routes

## Authenticated Page Load

1. A user requests `/`
2. [proxy.ts](/Users/hiroshige.negishi/Documents/Amplify/amplify-playground/proxy.ts) verifies session presence
3. [src/app/page.tsx](/Users/hiroshige.negishi/Documents/Amplify/amplify-playground/src/app/page.tsx) forwards into the workspace feature
4. [src/features/workspace/server/load-workspace-data.ts](/Users/hiroshige.negishi/Documents/Amplify/amplify-playground/src/features/workspace/server/load-workspace-data.ts) loads Projects, Tasks, and S3 file metadata
5. [src/features/workspace/components/workspace-interactive.tsx](/Users/hiroshige.negishi/Documents/Amplify/amplify-playground/src/features/workspace/components/workspace-interactive.tsx) handles pending state and optimism

## Task and Project Mutations

1. A user clicks in the interactive shell
2. The UI enters a transition
3. The optimistic reducer updates the local view immediately
4. A server action in [src/features/workspace/server/workspace-actions.ts](/Users/hiroshige.negishi/Documents/Amplify/amplify-playground/src/features/workspace/server/workspace-actions.ts) writes to Amplify Data
5. The router refreshes to reconcile with server truth

## File Uploads

1. The user selects a file in the workspace UI
2. The interactive shell submits `FormData` to `/api/files/upload`
3. [src/app/api/files/upload/route.ts](/Users/hiroshige.negishi/Documents/Amplify/amplify-playground/src/app/api/files/upload/route.ts) forwards into [src/features/workspace/server/project-file-routes.ts](/Users/hiroshige.negishi/Documents/Amplify/amplify-playground/src/features/workspace/server/project-file-routes.ts)
4. The route helper validates auth and project access
5. The file is written to S3
6. The page refreshes to show the uploaded object

## Signed URL Access

1. The user clicks “Open signed URL”
2. `/api/files/open` receives the request
3. The feature route helper checks auth
4. Amplify query calls the signed URL Lambda
5. The route redirects the browser to the signed S3 URL

## Session Refresh Verification

Use [src/app/api/auth/session-debug/route.ts](/Users/hiroshige.negishi/Documents/Amplify/amplify-playground/src/app/api/auth/session-debug/route.ts) when inspecting token refresh locally.

This route is for debugging and validation. It should not be treated as end-user product surface.
