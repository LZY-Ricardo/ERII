import { NextResponse } from "next/server";
import { requireDb } from "@/src/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/projects
 * 获取项目列表
 * Query params:
 * - focus: 过滤 focus (frontend/ai/tooling)
 * - featured: 只获取精选项目
 * - state: 过滤状态 (active/building/research)
 */
export async function GET(request) {
  try {
    const db = requireDb();
    const { searchParams } = new URL(request.url);
    const focus = searchParams.get("focus");
    const featured = searchParams.get("featured");
    const state = searchParams.get("state");

    let projects;

    // 根据参数构建不同的查询
    if (focus && focus !== "all" && featured === "true" && state) {
      projects = await db.sql`
        SELECT * FROM projects
        WHERE focus @> ${[focus]} AND featured = true AND state = ${state}
        ORDER BY sort_order ASC
      `;
    } else if (focus && focus !== "all" && featured === "true") {
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
    } else if (featured === "true" && state) {
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
    } else if (featured === "true") {
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

    return NextResponse.json({
      ok: true,
      data: projects.rows.map((p) => ({
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
      })),
    });
  } catch (error) {
    console.error("获取项目列表失败:", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
}
