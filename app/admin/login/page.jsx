"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";

function AdminLoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.ok) {
        router.push(from);
      } else {
        setError(data.error || "登录失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-shell">
      <div className="admin-login-card">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-[18px] bg-[rgba(139,36,49,0.1)] text-[var(--admin-accent)]">
          <Lock size={22} />
        </div>

        <p className="admin-kicker text-center">Admin Access</p>
        <h1 className="mt-2 text-center">进入后台工作台</h1>
        <p className="text-center">
          这是内容、评论、项目与站点配置的统一入口。输入管理员密码后继续。
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="管理员密码"
            autoFocus
            className="admin-input"
          />

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button type="submit" disabled={loading || !password} className="admin-button-primary w-full">
            {loading ? "登录中…" : "登录"}
          </button>
        </form>

        <div className="mt-5 rounded-2xl border border-[rgba(76,58,50,0.08)] bg-white/56 px-4 py-3">
          <p className="text-xs leading-6 text-[var(--admin-text-soft)]">
            登录后可统一管理文章、评论、项目与站点设置。若只是写作，也可以从这里跳到写作页。
          </p>
        </div>
      </div>
    </div>
  );
}

function AdminLoginPageFallback() {
  return (
    <div className="admin-login-shell">
      <div className="text-sm text-[var(--admin-text-soft)]">加载中…</div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<AdminLoginPageFallback />}>
      <AdminLoginPageContent />
    </Suspense>
  );
}
