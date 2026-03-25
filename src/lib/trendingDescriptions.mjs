const TRENDING_DESCRIPTION_MAP = {
  "FujiwaraChoki/MoneyPrinterV2": "自动化生成可变现内容的工作流工具。",
  "Crosstalk-Solutions/project-nomad": "一套自包含的离线生存计算机与关键工具包。",
  "opendataloader-project/opendataloader-pdf": "面向 AI 数据流程的 PDF 解析与无障碍处理工具。",
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
  const fullName = getRepoFullName(repo);
  if (fullName && TRENDING_DESCRIPTION_MAP[fullName]) {
    return TRENDING_DESCRIPTION_MAP[fullName];
  }

  return typeof repo?.description === "string" ? repo.description.trim() : "";
}
