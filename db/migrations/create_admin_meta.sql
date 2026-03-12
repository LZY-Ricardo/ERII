-- 创建管理员元数据表
-- 执行位置：Vercel Dashboard -> Storage -> Postgres -> Query

CREATE TABLE IF NOT EXISTS admin_meta (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_meta_key_idx ON admin_meta (key);

-- 初始化最后访问时间
INSERT INTO admin_meta (key, value)
VALUES ('last_visit', '0')
ON CONFLICT (key) DO NOTHING;
