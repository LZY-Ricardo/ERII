import { createPool } from '@vercel/postgres';
import fs from 'fs';

const connectionString = 'postgresql://neondb_owner:npg_OZQpJGAI8g0V@ep-frosty-glade-a1cyhxa1-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const db = createPool({ connectionString });

const article = {
  slug: 'claude-code-leak-ai-agent-engineering-playbook',
  title: 'Claude Code 源码事件之后：如何构建可控的 AI 编程 Agent',
  description: '基于近期行业事件，拆解工业级 AI Coding Agent 的工程框架与落地路线。',
  cover: '/images/covers/claude-code-leak-ai-agent-engineering-playbook.svg',
  date: new Date().toISOString().slice(0, 10),
  tags: ['AI', 'Agent', '开发效率', '工程实践', '工作流'],
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
      await db.sql`UPDATE posts SET title = ${article.title}, description = ${article.description}, cover = ${article.cover}, content = ${content}, content_format = ${article.content_format}, tags = ${article.tags}, updated_at = NOW() WHERE slug = ${article.slug}`;
      console.log('Draft updated successfully!');
    }
  } else {
    const result = await db.sql`INSERT INTO posts (slug, title, date, description, cover, content, content_format, tags, status) VALUES (${article.slug}, ${article.title}, ${article.date}, ${article.description}, ${article.cover}, ${content}, ${article.content_format}, ${article.tags}, 'draft') RETURNING id, slug, status`;
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
