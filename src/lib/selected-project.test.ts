import test from "node:test";
import assert from "node:assert/strict";

import { resolveSelectedProjectId } from "./selected-project";

test("resolveSelectedProjectId returns requested id when present", () => {
  assert.equal(resolveSelectedProjectId(["a", "b"], "b"), "b");
});

test("resolveSelectedProjectId falls back to first project when requested id is missing", () => {
  assert.equal(resolveSelectedProjectId(["a", "b"], "z"), "a");
});

test("resolveSelectedProjectId returns null when there are no projects", () => {
  assert.equal(resolveSelectedProjectId([], "z"), null);
});
