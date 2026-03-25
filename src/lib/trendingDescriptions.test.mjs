import assert from "node:assert/strict";
import { getTrendingDescription } from "./trendingDescriptions.mjs";

assert.equal(
  getTrendingDescription({
    fullName: "FujiwaraChoki/MoneyPrinterV2",
    description: "Automate the process of making money online.",
  }),
  "自动化生成可变现内容的工作流工具。"
);

assert.equal(
  getTrendingDescription({
    owner: "Crosstalk-Solutions",
    name: "project-nomad",
    description: "Project N.O.M.A.D. is a self-contained, offline survival computer packed with critical tools.",
  }),
  "一套自包含的离线生存计算机与关键工具包。"
);

assert.equal(
  getTrendingDescription({
    fullName: "opendataloader-project/opendataloader-pdf",
    description: "PDF Parser for AI-ready data. Automate PDF accessibility. Open-source.",
  }),
  "面向 AI 数据流程的 PDF 解析与无障碍处理工具。"
);

assert.equal(
  getTrendingDescription({
    fullName: "example/unknown-repo",
    description: "Original description",
  }),
  "Original description"
);

assert.equal(
  getTrendingDescription({
    fullName: "example/no-description",
  }),
  ""
);

console.log("trending description tests passed");
