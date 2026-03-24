const { Client } = require('pg');
const fs = require('fs');

const DATABASE_URL = process.env.DATABASE_URL;

const article = {
  slug: 'windows-cli-chinese-encoding-ultimate-guide',
  title: 'Windows 下 CLI 工具中文乱码问题终极指南',
  description: '从 cmd 到 PowerShell 7，一次搞懂 Windows 编码那些事。深入解析 Windows 终端中文乱码问题的根源与解决方案。',
  date: new Date().toISOString().slice(0, 10),
  tags: ['PowerShell', 'UTF-8', 'Windows', '开发工具', '编码', 'AI'],
  content_format: 'mdx'
};

async function createDraft() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    console.log('Connecting to database...');
    await client.connect();

    article.content = fs.readFileSync('F:/myProjects/erii-blog/scripts/article-content.md', 'utf8');

    const existingCheck = await client.query(
      'SELECT id, slug, status FROM posts WHERE slug = $1',
      [article.slug]
    );

    if (existingCheck.rows.length > 0) {
      const existing = existingCheck.rows[0];
      console.log('Article exists:');
      console.log('  slug:', existing.slug);
      console.log('  status:', existing.status);
      console.log('  id:', existing.id);

      if (existing.status === 'draft') {
        console.log('\nUpdating existing draft...');
        await client.query(
          `UPDATE posts SET
            title = $1, description = $2, content = $3,
            content_format = $4, tags = $5, updated_at = NOW()
          WHERE slug = $6`,
          [article.title, article.description, article.content, article.content_format, article.tags, article.slug]
        );
        console.log('Draft updated successfully!');
      } else {
        console.log('Article is published, use admin panel to modify');
      }
    } else {
      console.log('\nCreating new draft...');
      const result = await client.query(
        `INSERT INTO posts (slug, title, date, description, content, content_format, tags, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft')
        RETURNING id, slug, status`,
        [article.slug, article.title, article.date, article.description, article.content, article.content_format, article.tags]
      );

      const created = result.rows[0];
      console.log('Draft created successfully!');
      console.log('  id:', created.id);
      console.log('  slug:', created.slug);
      console.log('  status:', created.status);
    }

    console.log('\nCurrent drafts:');
    const drafts = await client.query(
      "SELECT slug, title, date FROM posts WHERE status = 'draft' ORDER BY date DESC"
    );
    drafts.rows.forEach(d => {
      console.log('  -', d.title, `(${d.slug})`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
  }
}

createDraft();
