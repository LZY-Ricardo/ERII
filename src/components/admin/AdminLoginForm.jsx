"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

function getSafeRedirect(value) {
  if (!value || !value.startsWith("/")) return "/admin";
  if (value.startsWith("//")) return "/admin";
  return value;
}

export default function AdminLoginForm({ from: rawFrom = "/admin", error: initialError = "" }) {
  const router = useRouter();
  const from = getSafeRedirect(rawFrom);

  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError);
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
        <p className="text-center">输入管理员密码后继续。</p>

        <form
          action={`/api/admin/login?from=${encodeURIComponent(from)}`}
          method="post"
          onSubmit={handleSubmit}
          className="mt-8 space-y-4"
        >
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="管理员密码"
            required
            autoFocus
            className="admin-input"
          />

          {error ? <p className="text-sm text-red-500">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="admin-button-primary w-full"
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>
      </div>
    </div>
  );
}
