import { requireDb } from "@/src/lib/db";
import { requireAdmin } from "@/src/lib/adminGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/projects
 * 获取项目列表（管理后台）
 */
export async function GET(request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const db = requireDb();
    const { searchParams } = new URL(request.url);
    const focus = searchParams.get("focus");
    const state = searchParams.get("state");

    let projects;

    // 根据参数构建不同的查询
    if (focus && focus !== "all" && state) {
      projects = await db.sql`
        SELECT
          id, name, tagline, summary, status, state,
          focus, tech, cover, featured, links,
          sort_order, created_at, updated_at
        FROM projects
        WHERE focus @> ${[focus]} AND state = ${state}
        ORDER BY sort_order ASC
      `;
    } else if (focus && focus !== "all") {
      projects = await db.sql`
        SELECT
          id, name, tagline, summary, status, state,
          focus, tech, cover, featured, links,
          sort_order, created_at, updated_at
        FROM projects
        WHERE focus @> ${[focus]}
        ORDER BY sort_order ASC
      `;
    } else if (state) {
      projects = await db.sql`
        SELECT
          id, name, tagline, summary, status, state,
          focus, tech, cover, featured, links,
          sort_order, created_at, updated_at
        FROM projects
        WHERE state = ${state}
        ORDER BY sort_order ASC
      `;
    } else {
      projects = await db.sql`
        SELECT
          id, name, tagline, summary, status, state,
          focus, tech, cover, featured, links,
          sort_order, created_at, updated_at
        FROM projects
        ORDER BY sort_order ASC
      `;
    }

    const rows = (projects.rows ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      tagline: r.tagline ?? "",
      summary: r.summary ?? "",
      status: r.status ?? "",
      state: r.state ?? "active",
      focus: r.focus ?? [],
      tech: r.tech ?? [],
      cover: r.cover ?? "",
      featured: r.featured ?? false,
      links: r.links ?? [],
      sortOrder: r.sort_order,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return Response.json({ ok: true, projects: rows });
  } catch (error) {
    console.error("Admin projects GET error:", error);
    return Response.json(
      { ok: false, error: "获取项目列表失败" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/projects
 * 创建新项目
 */
export async function POST(request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const db = requireDb();
    const body = await request.json();

    const {
      id,
      name,
      tagline = "",
      summary = "",
      status = "",
      state = "active",
      focus = [],
      tech = [],
      cover = "",
      featured = false,
      links = [],
    } = body;

    if (!id || !name) {
      return Response.json(
        { ok: false, error: "项目 ID 和名称不能为空" },
        { status: 400 }
      );
    }

    // 获取当前最大 sort_order
    const maxOrder = await db.sql`
      SELECT COALESCE(MAX(sort_order), 0) as max_order FROM projects
    `;
    const sortOrder = (maxOrder.rows[0]?.max_order ?? 0) + 1;

    await db.sql`
      INSERT INTO projects (
        id, name, tagline, summary, status, state,
        focus, tech, cover, featured, links, sort_order
      ) VALUES (
        ${id}, ${name}, ${tagline}, ${summary}, ${status}, ${state},
        ${db.array(focus)}, ${db.array(tech)}, ${cover},
        ${featured}, ${db.json(links)}, ${sortOrder}
      )
    `;

    return Response.json({ ok: true, id });
  } catch (error) {
    console.error("Admin projects POST error:", error);
    return Response.json(
      { ok: false, error: "创建项目失败" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/projects
 * 更新项目
 */
export async function PUT(request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const db = requireDb();
    const body = await request.json();

    const {
      id,
      name,
      tagline = "",
      summary = "",
      status = "",
      state = "active",
      focus = [],
      tech = [],
      cover = "",
      featured = false,
      links = [],
      sortOrder,
    } = body;

    if (!id || !name) {
      return Response.json(
        { ok: false, error: "项目 ID 和名称不能为空" },
        { status: 400 }
      );
    }

    await db.sql`
      UPDATE projects
      SET
        name = ${name},
        tagline = ${tagline},
        summary = ${summary},
        status = ${status},
        state = ${state},
        focus = ${db.array(focus)},
        tech = ${db.array(tech)},
        cover = ${cover},
        featured = ${featured},
        links = ${db.json(links)},
        sort_order = ${sortOrder},
        updated_at = NOW()
      WHERE id = ${id}
    `;

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Admin projects PUT error:", error);
    return Response.json(
      { ok: false, error: "更新项目失败" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/projects
 * 删除项目
 */
export async function DELETE(request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const db = requireDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json(
        { ok: false, error: "项目 ID 不能为空" },
        { status: 400 }
      );
    }

    await db.sql`DELETE FROM projects WHERE id = ${id}`;

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Admin projects DELETE error:", error);
    return Response.json(
      { ok: false, error: "删除项目失败" },
      { status: 500 }
    );
  }
}
