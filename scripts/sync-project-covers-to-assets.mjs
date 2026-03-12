/**
 * 将现有项目封面图片记录到 assets 表
 */

import { db } from "../src/lib/db.js";

async function migrateProjectCoversToAssets() {
  console.log("开始迁移项目封面到 assets 表...\n");

  // 获取所有有封面的项目
  const projects = await db.sql`
    SELECT id, name, cover FROM projects
    WHERE cover IS NOT NULL AND cover != ''
    ORDER BY sort_order
  `;

  for (const project of projects.rows) {
    const cover = project.cover;

    // 只处理本地路径，跳过已经是 Blob URL 的
    if (cover.startsWith("http://") || cover.startsWith("https://")) {
      console.log(`⊙ ${project.name} (${project.id}) - 已是 Blob URL，跳过`);
      continue;
    }

    if (!cover.startsWith("/images/projects/")) {
      console.log(`⊙ ${project.name} (${project.id}) - 非项目封面路径，跳过`);
      continue;
    }

    // 提取文件名
    const filename = cover.split("/").pop();
    const pathname = cover.startsWith("/") ? cover.slice(1) : cover; // 去掉开头的 /

    try {
      // 检查是否已存在
      const existing = await db.sql`
        SELECT id FROM assets WHERE pathname = ${pathname}
      `;

      if (existing.rows.length > 0) {
        console.log(`○ ${project.name} (${project.id}) - 已存在，跳过`);
        continue;
      }

      // 插入到 assets 表
      await db.sql`
        INSERT INTO assets (url, pathname, content_type, size, source_provider, source_url)
        VALUES (
          ${cover},
          ${pathname},
          'image/png',
          NULL,
          'internal',
          NULL
        )
      `;

      console.log(`✓ ${project.name} (${project.id}) - ${cover}`);
    } catch (error) {
      console.error(`✗ ${project.name} (${project.id}) - 失败:`, error.message);
    }
  }

  console.log("\n迁移完成！");
  console.log(`总计: ${projects.rows.length} 个项目`);
}

migrateProjectCoversToAssets().catch(console.error);
