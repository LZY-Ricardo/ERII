"use client";

import { Editor } from "@bytemd/react";
import gfm from "@bytemd/plugin-gfm";
import highlight from "@bytemd/plugin-highlight";
import frontmatter from "@bytemd/plugin-frontmatter";
import "bytemd/dist/index.css";
import "highlight.js/styles/github.css";

const plugins = [
  gfm(),
  highlight(),
  frontmatter(),
];

export default function ByteMDEditor({ value, onChange, placeholder }) {
  return (
    <Editor
      value={value}
      plugins={plugins}
      onChange={onChange}
      placeholder={placeholder}
      uploadImages={async (files) => {
        // 图片上传逻辑将在后续集成
        return [];
      }}
    />
  );
}
