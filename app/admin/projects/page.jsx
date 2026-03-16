"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Folder,
  ExternalLink,
  Pencil,
  Search,
  Plus,
  Star,
} from "lucide-react";

const STATE_LABEL = {
  active: "进行中",
  building: "开发中",
  research: "研究中",
};

const STATE_COLOR = {
  active: "bg-emerald-50 text-emerald-700",
  building: "bg-blue-50 text-blue-700",
  research: "bg-purple-50 text-purple-700",
};

const FOCUS_LABEL = {
  frontend: "前端",
  ai: "AI",
  tooling: "工具链",
};

function fmtDate(v) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("zh-CN");
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/projects")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setProjects(data.projects ?? []);
        else setError(data.error || "加载失败");
      })
      .catch(() => setError("网络错误"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter((p) => {
    if (stateFilter !== "all" && p.state !== stateFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.name?.toLowerCase().includes(q) ||
        p.id?.toLowerCase().includes(q) ||
        p.summary?.toLowerCase().includes(q) ||
        p.tech?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400 text-sm">
        加载中…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center text-red-500 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-3">
        {/* Search */}
        <div className="relative flex-1 min-w-45">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索项目名称、ID、简介或技术栈…"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-3 text-sm
              text-gray-700 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          />
        </div>

        {/* State filter */}
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm
            text-gray-700 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
        >
          <option value="all">全部状态</option>
          <option value="active">进行中</option>
          <option value="building">开发中</option>
          <option value="research">研究中</option>
        </select>

        {/* New project button */}
        <Link
          href="/admin/projects/new"
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-rose-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-600 transition-colors"
        >
          <Plus size={15} />
          新建项目
        </Link>
      </div>

      {/* Projects table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-400">
            未找到项目
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-400">
                <th className="px-5 py-3 font-medium">项目</th>
                <th className="px-3 py-3 font-medium w-20">状态</th>
                <th className="px-3 py-3 font-medium w-24">更新</th>
                <th className="px-3 py-3 font-medium w-24 text-right">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((project) => (
                <tr
                  key={project.id}
                  className="hover:bg-gray-50/60 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-start gap-3">
                      {/* Cover */}
                      {project.cover ? (
                        <Image
                          src={project.cover}
                          alt={`${project.name} 封面`}
                          width={48}
                          height={48}
                          unoptimized
                          className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200" />
                      )}

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-gray-800 truncate">
                            {project.name}
                          </p>
                          {project.featured && (
                            <Star size={12} className="fill-amber-400 text-amber-400" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate">
                          {project.id}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                          {project.summary}
                        </p>
                        {/* Focus tags */}
                        <div className="flex gap-1 mt-1">
                          {(project.focus ?? []).map((f) => (
                            <span
                              key={f}
                              className="inline-flex rounded px-1 py-0.5 text-[10px]
                                bg-gray-100 text-gray-600"
                            >
                              {FOCUS_LABEL[f] || f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        STATE_COLOR[project.state] || "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {STATE_LABEL[project.state] || project.state}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {fmtDate(project.updatedAt)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/projects/${project.id}`}
                        className="p-1.5 rounded-md hover:bg-gray-200/60 transition-colors"
                        title="编辑"
                      >
                        <Pencil size={14} className="text-gray-400" />
                      </Link>
                      {project.links?.[0] && (
                        <a
                          href={project.links[0].href}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-md hover:bg-gray-200/60 transition-colors"
                          title="查看项目"
                        >
                          <ExternalLink
                            size={14}
                            className="text-gray-400"
                          />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
