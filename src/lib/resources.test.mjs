import assert from "node:assert/strict";
import {
  getResourceSections,
  getResourceTotal,
  RESOURCE_LIBRARY_INTRO,
} from "./resources.mjs";

const sections = getResourceSections();

assert.deepEqual(
  sections.map((section) => section.id),
  ["ai", "development", "network", "productivity"]
);

assert.equal(getResourceTotal(), 15);

const networkSection = sections.find((section) => section.id === "network");
const productivitySection = sections.find(
  (section) => section.id === "productivity"
);

assert.ok(networkSection);
assert.equal(networkSection.resources.length, 1);
assert.deepEqual(networkSection.resources[0].tags, ["自用推荐", "邀请链接"]);

assert.ok(productivitySection);
assert.equal(productivitySection.resources.length, 7);
assert.ok(
  productivitySection.resources.some((resource) => resource.name === "Flow Launcher")
);
assert.equal(
  productivitySection.resources.find((resource) => resource.name === "PixPin")?.href,
  "https://pixpin.cn/"
);
assert.equal(
  productivitySection.resources.find((resource) => resource.name === "剪切助手")?.href,
  "https://jianqiezhushou.com/"
);

assert.match(RESOURCE_LIBRARY_INTRO.title, /资源库/);
assert.equal(RESOURCE_LIBRARY_INTRO.paragraphs.length, 3);
assert.match(RESOURCE_LIBRARY_INTRO.paragraphs[2], /邀请关系/);

console.log("resource library tests passed");
