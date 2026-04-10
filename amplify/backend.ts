import { defineBackend } from "@aws-amplify/backend";

import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";

const backend = defineBackend({
  auth,
  data,
  storage,
});

const userPoolClient = backend.auth.resources.cfnResources.cfnUserPoolClient;

// Cognito access/id token validity cannot be shorter than 5 minutes.
userPoolClient.accessTokenValidity = 5;
userPoolClient.idTokenValidity = 5;
userPoolClient.refreshTokenValidity = 24;
userPoolClient.explicitAuthFlows = ["ALLOW_CUSTOM_AUTH", "ALLOW_USER_SRP_AUTH"];
userPoolClient.tokenValidityUnits = {
  accessToken: "minutes",
  idToken: "minutes",
  refreshToken: "hours",
};
userPoolClient.refreshTokenRotation = {
  feature: "ENABLED",
  retryGracePeriodSeconds: 10,
};
