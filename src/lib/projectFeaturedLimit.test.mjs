import test from "node:test";
import assert from "node:assert/strict";

import { MAX_FEATURED_PROJECTS, shouldRejectFeaturedChange } from "./projectFeaturedLimit.js";

test("MAX_FEATURED_PROJECTS is fixed to homepage capacity", () => {
  assert.equal(MAX_FEATURED_PROJECTS, 3);
});

test("shouldRejectFeaturedChange allows enabling featured when below the limit", () => {
  assert.equal(
    shouldRejectFeaturedChange({
      featuredCount: 2,
      isCurrentFeatured: false,
      nextFeatured: true,
    }),
    false
  );
});

test("shouldRejectFeaturedChange allows keeping an already featured project", () => {
  assert.equal(
    shouldRejectFeaturedChange({
      featuredCount: 3,
      isCurrentFeatured: true,
      nextFeatured: true,
    }),
    false
  );
});

test("shouldRejectFeaturedChange rejects enabling featured when limit is reached", () => {
  assert.equal(
    shouldRejectFeaturedChange({
      featuredCount: 3,
      isCurrentFeatured: false,
      nextFeatured: true,
    }),
    true
  );
});
