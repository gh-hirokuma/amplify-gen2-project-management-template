import { a, defineData, type ClientSchema } from "@aws-amplify/backend";

import { getProjectFileUrl } from "../functions/get-project-file-url/resource";

const schema = a.schema({
    Project: a
      .model({
        name: a.string().required(),
        description: a.string(),
        sortOrder: a.integer(),
        tone: a.enum(["backlog", "active", "paused", "done"]),
        tasks: a.hasMany("Task", "projectId"),
      })
      .authorization((allow) => [allow.owner()]),
    Task: a
      .model({
        title: a.string().required(),
        note: a.string(),
        dueDate: a.string(),
        sortOrder: a.integer(),
        done: a.boolean().required(),
        projectId: a.id().required(),
        project: a.belongsTo("Project", "projectId"),
      })
      .authorization((allow) => [allow.owner()]),
    SignedProjectFileUrl: a.customType({
      path: a.string().required(),
      url: a.string().required(),
      expiresAt: a.string().required(),
    }),
    getSignedProjectFileUrl: a
      .query()
      .arguments({
        projectId: a.id().required(),
        path: a.string().required(),
      })
      .returns(a.ref("SignedProjectFileUrl"))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(getProjectFileUrl)),
  });

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
