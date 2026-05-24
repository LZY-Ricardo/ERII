import test from "node:test";
import assert from "node:assert/strict";

import { groupProjectActions } from "./projectCardGroups.js";

test("groupProjectActions prefers live and github actions while preserving others", () => {
  const actions = [
    { href: "https://example.com/demo", label: "在线体验" },
    { href: "https://github.com/demo/repo", label: "GitHub" },
    { href: "/docs", label: "文档" },
  ];

  assert.deepEqual(groupProjectActions(actions), {
    liveAction: actions[0],
    githubAction: actions[1],
    otherActions: [actions[2]],
  });
});
