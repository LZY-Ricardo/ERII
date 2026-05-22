import test from "node:test";
import assert from "node:assert/strict";

import { shouldEnableSiteScrollbar } from "./siteScrollbar.js";

test("shouldEnableSiteScrollbar enables the public site routes", () => {
  assert.equal(shouldEnableSiteScrollbar("/"), true);
  assert.equal(shouldEnableSiteScrollbar("/blog/post-1"), true);
  assert.equal(shouldEnableSiteScrollbar("/projects"), true);
  assert.equal(shouldEnableSiteScrollbar("/resources?topic=ai"), true);
});

test("shouldEnableSiteScrollbar skips admin and write workspaces", () => {
  assert.equal(shouldEnableSiteScrollbar("/admin"), false);
  assert.equal(shouldEnableSiteScrollbar("/admin/comments"), false);
  assert.equal(shouldEnableSiteScrollbar("/admin-login"), false);
  assert.equal(shouldEnableSiteScrollbar("/write"), false);
  assert.equal(shouldEnableSiteScrollbar("/write?slug=draft"), false);
});
