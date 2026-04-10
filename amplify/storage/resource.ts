import { defineStorage } from "@aws-amplify/backend";

import { getProjectFileUrl } from "../functions/get-project-file-url/resource";

export const storage = defineStorage({
  name: "projectFiles",
  isDefault: true,
  access: (allow) => ({
    "project-files/*": [
      allow.authenticated.to(["read", "write", "delete"]),
      allow.resource(getProjectFileUrl).to(["read"]),
    ],
  }),
});
