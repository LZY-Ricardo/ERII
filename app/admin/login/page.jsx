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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-gray-200 bg-white px-8 py-10 shadow-sm">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50">
            <Lock size={22} className="text-rose-600" />
          </div>

          <h1 className="mb-1 text-center text-lg font-semibold text-gray-800">
            管理后台
          </h1>
          <p className="mb-6 text-center text-sm text-gray-400">
            请输入管理员密码
          </p>

          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码"
              autoFocus
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm
                text-gray-800 placeholder-gray-400 outline-none
                focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition-colors"
            />

            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="mt-4 w-full rounded-lg bg-rose-600 py-2.5 text-sm font-medium text-white
                hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "登录中…" : "登录"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-gray-300">
          Erii Blog Admin
        </p>
      </div>
    </div>
  );
}

function AdminLoginPageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-sm text-gray-400">加载中…</div>
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
