import test from "node:test";
import assert from "node:assert/strict";

import { filterProjectCollectionByFocus } from "./projectFilters.js";
import { optimizeProjectCoverUrl } from "./projectCoverOptimization.js";

const projects = [
  { id: "one", focus: ["frontend", "tooling"] },
  { id: "two", focus: ["ai"] },
  { id: "three", focus: [] },
  { id: "four", focus: "frontend" },
];

test("filterProjectCollectionByFocus returns all projects for all or invalid focus", () => {
  assert.deepEqual(filterProjectCollectionByFocus(projects, "all"), projects);
  assert.deepEqual(filterProjectCollectionByFocus(projects, "unknown"), projects);
});

test("filterProjectCollectionByFocus filters array and string focus values", () => {
  assert.deepEqual(
    filterProjectCollectionByFocus(projects, "frontend").map((project) => project.id),
    ["one", "four"]
  );
});

test("optimizeProjectCoverUrl prefers generated local webp covers", () => {
  assert.equal(optimizeProjectCoverUrl("/images/projects/erii.png"), "/images/projects/erii.webp");
  assert.equal(
    optimizeProjectCoverUrl("/images/projects/unknown.png"),
    "/images/projects/unknown.png"
  );
  assert.equal(
    optimizeProjectCoverUrl("https://example.com/project.png"),
    "https://example.com/project.png"
  );
});
