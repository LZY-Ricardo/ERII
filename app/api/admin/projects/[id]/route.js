import { requireDb } from "@/src/lib/db";
import { requireAdmin } from "@/src/lib/adminGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/projects/[id]
 * 获取单个项目详情
 */
export async function GET(request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const db = requireDb();
    const { id } = await params;

    const project = await db.sql`
      SELECT
        id, name, tagline, summary, status, state,
        focus, tech, cover, featured, links,
        sort_order, created_at, updated_at
      FROM projects
      WHERE id = ${id}
    `;

    if (!project.rows || project.rows.length === 0) {
      return Response.json(
        { ok: false, error: "项目不存在" },
        { status: 404 }
      );
    }

    const r = project.rows[0];
    return Response.json({
      ok: true,
      project: {
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
      },
    });
  } catch (error) {
    console.error("Admin project GET error:", error);
    return Response.json(
      { ok: false, error: "获取项目失败" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/projects/[id]
 * 更新单个项目
 */
export async function PUT(request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const db = requireDb();
    const { id } = await params;
    const body = await request.json();

    const {
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

    if (!name) {
      return Response.json(
        { ok: false, error: "项目名称不能为空" },
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
    console.error("Admin project PUT error:", error);
    return Response.json(
      { ok: false, error: "更新项目失败" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/projects/[id]
 * 删除单个项目
 */
export async function DELETE(request, { params }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const db = requireDb();
    const { id } = await params;

    await db.sql`DELETE FROM projects WHERE id = ${id}`;

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Admin project DELETE error:", error);
    return Response.json(
      { ok: false, error: "删除项目失败" },
      { status: 500 }
    );
  }
}
