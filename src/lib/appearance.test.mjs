import test from "node:test";
import assert from "node:assert/strict";

import {
  buildBackgroundTheme,
  buildCardBackground,
  normalizeCardTransparency,
} from "./appearance.js";

test("normalizeCardTransparency clamps and rounds values into supported range", () => {
  assert.equal(normalizeCardTransparency(18.6), 19);
  assert.equal(normalizeCardTransparency(-10), 0);
  assert.equal(normalizeCardTransparency(100), 65);
  assert.equal(normalizeCardTransparency("oops"), 25);
});

test("buildCardBackground keeps existing light card palette", () => {
  assert.deepEqual(buildCardBackground(25, false), {
    bg: "rgba(255, 249, 242, 0.75)",
    solid: "rgba(255, 250, 245, 0.787)",
  });
});

test("buildBackgroundTheme preserves the illustrated default background", () => {
  assert.deepEqual(buildBackgroundTheme({ darkMode: false, cleanBackground: false }), {
    background: "#f3ece3",
    image: 'url("/images/longzu-bg.png")',
    overlayTop: "rgba(255, 255, 255, 0)",
    overlayBottom: "rgba(255, 255, 255, 0)",
  });
});

test("buildBackgroundTheme removes artwork for clean light background", () => {
  assert.deepEqual(buildBackgroundTheme({ darkMode: false, cleanBackground: true }), {
    background: "#ffffff",
    image: "none",
    overlayTop: "rgba(255, 255, 255, 0)",
    overlayBottom: "rgba(255, 255, 255, 0)",
  });
});

test("buildBackgroundTheme removes artwork for clean dark background", () => {
  assert.deepEqual(buildBackgroundTheme({ darkMode: true, cleanBackground: true }), {
    background: "#000000",
    image: "none",
    overlayTop: "rgba(0, 0, 0, 0)",
    overlayBottom: "rgba(0, 0, 0, 0)",
  });
});
