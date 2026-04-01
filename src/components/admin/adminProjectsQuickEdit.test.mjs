import test from "node:test";
import assert from "node:assert/strict";

import {
  applyQuickProjectPatch,
  buildQuickProjectPayload,
  moveFeaturedProject,
} from "./adminProjectsQuickEdit.js";

test("buildQuickProjectPayload merges patch while preserving required fields", () => {
  const project = {
    id: "unmark",
    name: "Unmark",
    tagline: "tagline",
    summary: "summary",
    status: "持续更新",
    state: "active",
    focus: ["frontend"],
    tech: ["React"],
    cover: "/cover.png",
    featured: false,
    links: [{ label: "GitHub", href: "https://github.com/x", external: true }],
    sortOrder: 5,
  };

  const payload = buildQuickProjectPayload(project, {
    featured: true,
    sortOrder: 2,
  });

  assert.deepEqual(payload, {
    id: "unmark",
    name: "Unmark",
    tagline: "tagline",
    summary: "summary",
    status: "持续更新",
    state: "active",
    focus: ["frontend"],
    tech: ["React"],
    cover: "/cover.png",
    featured: true,
    links: [{ label: "GitHub", href: "https://github.com/x", external: true }],
    sortOrder: 2,
  });
});

test("applyQuickProjectPatch updates only the targeted project", () => {
  const projects = [
    { id: "unmark", featured: false, sortOrder: 4, name: "Unmark" },
    { id: "react-playground", featured: true, sortOrder: 1, name: "React Playground" },
  ];

  const nextProjects = applyQuickProjectPatch(projects, "unmark", {
    featured: true,
    sortOrder: 2,
  });

  assert.notStrictEqual(nextProjects, projects);
  assert.deepEqual(nextProjects, [
    { id: "unmark", featured: true, sortOrder: 2, name: "Unmark" },
    { id: "react-playground", featured: true, sortOrder: 1, name: "React Playground" },
  ]);
});

test("moveFeaturedProject swaps sort order with previous featured project", () => {
  const projects = [
    { id: "wardrobe", featured: true, sortOrder: 1, name: "Wardrobe" },
    { id: "unmark", featured: true, sortOrder: 2, name: "Unmark" },
    { id: "react-playground", featured: true, sortOrder: 3, name: "React Playground" },
    { id: "archive", featured: false, sortOrder: 99, name: "Archive" },
  ];

  const result = moveFeaturedProject(projects, "unmark", "up");

  assert.deepEqual(result.changedIds, ["unmark", "wardrobe"]);
  assert.deepEqual(result.projects, [
    { id: "wardrobe", featured: true, sortOrder: 2, name: "Wardrobe" },
    { id: "unmark", featured: true, sortOrder: 1, name: "Unmark" },
    { id: "react-playground", featured: true, sortOrder: 3, name: "React Playground" },
    { id: "archive", featured: false, sortOrder: 99, name: "Archive" },
  ]);
});

test("moveFeaturedProject keeps state unchanged when target is already first", () => {
  const projects = [
    { id: "wardrobe", featured: true, sortOrder: 1, name: "Wardrobe" },
    { id: "unmark", featured: true, sortOrder: 2, name: "Unmark" },
  ];

  const result = moveFeaturedProject(projects, "wardrobe", "up");

  assert.deepEqual(result.changedIds, []);
  assert.deepEqual(result.projects, projects);
});
