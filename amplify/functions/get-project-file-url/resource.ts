import { defineFunction } from "@aws-amplify/backend";

export const getProjectFileUrl = defineFunction({
  name: "get-project-file-url",
  entry: "./handler.ts",
  runtime: 24,
  timeoutSeconds: 10,
});
