const TRENDING_DESCRIPTION_MAP = {
  "FujiwaraChoki/MoneyPrinterV2": "自动化生成可变现内容的工作流工具。",
  "Crosstalk-Solutions/project-nomad": "一套自包含的离线生存计算机与关键工具包。",
  "opendataloader-project/opendataloader-pdf": "面向 AI 数据流程的 PDF 解析与无障碍处理工具。",
  "colbymchenry/codegraph": "预索引的代码知识图谱，适用于 Claude Code、Codex、Cursor 等工具——更少的 token、更少的工具调用，完全本地运行。",
  "tinyhumansai/openhuman": "你的个人 AI 超级智能体。私密、简单且极其强大。",
  "Imbad0202/academic-research-skills": "面向 Claude Code 的学术研究技能：研究 → 撰写 → 审阅 → 修改 → 定稿。",
  "ruvnet/RuView": "将普通 WiFi 信号转化为实时空间智能、生命体征监测和存在检测——无需任何摄像头。",
  "rohitg00/agentmemory": "基于真实场景基准测试的 AI 编程代理持久记忆方案，排名第一。",
};

function getRepoFullName(repo) {
  if (!repo || typeof repo !== "object") return "";
  if (typeof repo.fullName === "string" && repo.fullName.trim()) {
    return repo.fullName.trim();
  }

  const owner = typeof repo.owner === "string" ? repo.owner.trim() : "";
  const name = typeof repo.name === "string" ? repo.name.trim() : "";
  return owner && name ? `${owner}/${name}` : "";
}

export function getTrendingDescription(repo) {
  return getTrendingDescriptionByLang(repo, "zh");
}

export function getTrendingDescriptionByLang(repo, lang = "zh") {
  const fullName = getRepoFullName(repo);

  if (lang === "zh" && fullName && TRENDING_DESCRIPTION_MAP[fullName]) {
    return TRENDING_DESCRIPTION_MAP[fullName];
  }

  return typeof repo?.description === "string" ? repo.description.trim() : "";
}
