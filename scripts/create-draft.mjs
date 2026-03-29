import { createPool } from '@vercel/postgres';
import fs from 'fs';

const connectionString = 'postgresql://neondb_owner:npg_OZQpJGAI8g0V@ep-frosty-glade-a1cyhxa1-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const db = createPool({ connectionString });

const article = {
  slug: 'windows-cli-chinese-encoding-ultimate-guide',
  title: 'Windows 下 CLI 工具中文乱码问题终极指南',
  description: '从 cmd 到 PowerShell 7，一次搞懂 Windows 编码那些事。深入解析 Windows 终端中文乱码问题的根源与解决方案。',
  date: new Date().toISOString().slice(0, 10),
  tags: ['PowerShell', 'UTF-8', 'Windows', '开发工具', '编码', 'AI'],
  content_format: 'mdx'
};

try {
  console.log('Connecting to database...');
  
  const content = fs.readFileSync('F:/myProjects/erii-blog/scripts/article-content.md', 'utf8');
  
  const existing = await db.sql`SELECT id, slug, status FROM posts WHERE slug = ${article.slug}`;
  
  if (existing.rows.length > 0) {
    const row = existing.rows[0];
    console.log('Article exists:', row.slug, 'status:', row.status);
    
    if (row.status === 'draft') {
      await db.sql`UPDATE posts SET title = ${article.title}, description = ${article.description}, content = ${content}, content_format = ${article.content_format}, tags = ${article.tags}, updated_at = NOW() WHERE slug = ${article.slug}`;
      console.log('Draft updated successfully!');
    }
  } else {
    const result = await db.sql`INSERT INTO posts (slug, title, date, description, content, content_format, tags, status) VALUES (${article.slug}, ${article.title}, ${article.date}, ${article.description}, ${content}, ${article.content_format}, ${article.tags}, 'draft') RETURNING id, slug, status`;
    console.log('Draft created successfully! ID:', result.rows[0].id);
  }

  console.log('\nCurrent drafts:');
  const drafts = await db.sql`SELECT slug, title, date FROM posts WHERE status = 'draft' ORDER BY date DESC`;
  drafts.rows.forEach(d => {
    console.log('  -', d.title, `(${d.slug})`);
  });
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await db.end();
  console.log('\nDatabase connection closed');
}
