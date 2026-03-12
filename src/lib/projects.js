import { cache } from "react";
import { requireDb } from "./db";

export const PROJECT_FOCUS = [
  { value: "all", label: "全部项目" },
  { value: "frontend", label: "前端" },
  { value: "ai", label: "AI" },
  { value: "tooling", label: "工具链" },
];

/**
 * 服务器端：直接从数据库获取项目
 */
async function fetchProjectsFromDb(params = {}) {
  const db = requireDb();
  const { focus, featured, state } = params;

  let projects;

  // 根据参数构建不同的查询
  if (focus && focus !== "all" && featured && state) {
    projects = await db.sql`
      SELECT * FROM projects
      WHERE focus @> ${[focus]} AND featured = true AND state = ${state}
      ORDER BY sort_order ASC
    `;
  } else if (focus && focus !== "all" && featured) {
    projects = await db.sql`
      SELECT * FROM projects
      WHERE focus @> ${[focus]} AND featured = true
      ORDER BY sort_order ASC
    `;
  } else if (focus && focus !== "all" && state) {
    projects = await db.sql`
      SELECT * FROM projects
      WHERE focus @> ${[focus]} AND state = ${state}
      ORDER BY sort_order ASC
    `;
  } else if (featured && state) {
    projects = await db.sql`
      SELECT * FROM projects
      WHERE featured = true AND state = ${state}
      ORDER BY sort_order ASC
    `;
  } else if (focus && focus !== "all") {
    projects = await db.sql`
      SELECT * FROM projects
      WHERE focus @> ${[focus]}
      ORDER BY sort_order ASC
    `;
  } else if (featured) {
    projects = await db.sql`
      SELECT * FROM projects
      WHERE featured = true
      ORDER BY sort_order ASC
    `;
  } else if (state) {
    projects = await db.sql`
      SELECT * FROM projects
      WHERE state = ${state}
      ORDER BY sort_order ASC
    `;
  } else {
    projects = await db.sql`
      SELECT * FROM projects
      ORDER BY sort_order ASC
    `;
  }

  return projects.rows.map((p) => ({
    id: p.id,
    name: p.name,
    tagline: p.tagline,
    summary: p.summary,
    status: p.status,
    state: p.state,
    focus: p.focus,
    tech: p.tech,
    cover: p.cover,
    featured: p.featured,
    links: p.links,
  }));
}

/**
 * 客户端：从 API 获取项目
 */
async function fetchProjectsFromApi(params = {}) {
  const query = new URLSearchParams();
  if (params.focus && params.focus !== "all") query.set("focus", params.focus);
  if (params.featured) query.set("featured", "true");
  if (params.state) query.set("state", params.state);

  const queryString = query.toString();
  const res = await fetch(`/api/projects${queryString ? "?" + queryString : ""}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    console.error("获取项目失败:", await res.text());
    return [];
  }

  const json = await res.json();
  return json.data || [];
}

/**
 * 获取所有项目（服务器端）
 */
export const getAllProjects = cache(async () => {
  return fetchProjectsFromDb();
});

/**
 * 获取精选项目（服务器端）
 */
export const getFeaturedProjects = cache(async (limit = 3) => {
  const projects = await fetchProjectsFromDb({ featured: true });
  return projects.slice(0, limit);
});

/**
 * 按 focus 过滤项目（服务器端）
 */
export async function filterProjectsByFocus(focus = "all") {
  return fetchProjectsFromDb({ focus });
}

/**
 * 获取项目（服务器端/客户端通用）
 */
export async function getProjects(params = {}) {
  return fetchProjectsFromDb(params);
}
