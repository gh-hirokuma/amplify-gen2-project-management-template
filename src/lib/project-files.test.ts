import test from "node:test";
import assert from "node:assert/strict";

import {
  buildProjectFilePath,
  sanitizeFileName,
  validateProjectFilePath,
} from "./project-files";

test("sanitizeFileName strips dangerous characters but keeps extension", () => {
  assert.equal(sanitizeFileName("../Quarterly Report (final).pdf"), "quarterly-report-final.pdf");
});

test("buildProjectFilePath nests uploads under the selected project", () => {
  const path = buildProjectFilePath({
    projectId: "project-123",
    fileName: "Spec Sheet v2.png",
    timestamp: "2026-04-10T09:30:00.000Z",
  });

  assert.match(
    path,
    /^project-files\/project-123\/2026-04-10T09-30-00-000Z-spec-sheet-v2\.png$/,
  );
});

test("validateProjectFilePath accepts only the matching project prefix", () => {
  assert.equal(
    validateProjectFilePath("project-files/project-123/2026-04-10T09-30-00-000Z-spec-sheet-v2.png", {
      projectId: "project-123",
    }),
    true,
  );

  assert.equal(
    validateProjectFilePath("project-files/project-999/2026-04-10T09-30-00-000Z-spec-sheet-v2.png", {
      projectId: "project-123",
    }),
    false,
  );

  assert.equal(
    validateProjectFilePath("private/project-123/spec-sheet-v2.png", {
      projectId: "project-123",
    }),
    false,
  );
});
