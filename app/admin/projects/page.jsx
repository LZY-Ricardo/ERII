"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  applyQuickProjectPatch,
  assignFeaturedProjectSlot,
  buildQuickProjectPayload,
} from "@/src/components/admin/adminProjectsQuickEdit";
import {
  FEATURED_PROJECT_LIMIT_ERROR,
  MAX_FEATURED_PROJECTS,
} from "@/src/lib/projectFeaturedLimit";
import {
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
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [savingMap, setSavingMap] = useState({});

  useEffect(() => {
    fetch("/api/admin/projects")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setProjects(data.projects ?? []);
        else setLoadError(data.error || "加载失败");
      })
      .catch(() => setLoadError("网络错误"))
      .finally(() => setLoading(false));
  }, []);

  const setProjectSaving = (projectId, saving) => {
    setSavingMap((current) => {
      if (saving) return { ...current, [projectId]: true };
      const next = { ...current };
      delete next[projectId];
      return next;
    });
  };

  const persistProjectsState = async (previousProjects, nextProjects, changedIds) => {
    if (!changedIds.length) return;
    setError("");
    setProjects(nextProjects);
    changedIds.forEach((projectId) => setProjectSaving(projectId, true));

    try {
      for (const projectId of changedIds) {
        const nextProject = nextProjects.find((item) => item.id === projectId);
        if (!nextProject) continue;

        const res = await fetch(`/api/admin/projects/${projectId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildQuickProjectPayload(nextProject)),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "保存失败");
      }
    } catch (err) {
      setProjects(previousProjects);
      setError(err.message || "保存失败");
    } finally {
      changedIds.forEach((projectId) => setProjectSaving(projectId, false));
    }
  };

  const persistProjectPatch = async (projectId, patch) => {
    const currentProject = projects.find((item) => item.id === projectId);
    if (!currentProject) return;

    const previousProjects = projects;
    const nextProjects = applyQuickProjectPatch(previousProjects, projectId, patch);
    await persistProjectsState(previousProjects, nextProjects, [projectId]);
  };

  const handleFeaturedToggle = async (project) => {
    const featuredCount = projects.filter((item) => item.featured).length;
    if (!project.featured && featuredCount >= MAX_FEATURED_PROJECTS) {
      setError(FEATURED_PROJECT_LIMIT_ERROR);
      return;
    }
    await persistProjectPatch(project.id, {
      featured: !project.featured,
    });
  };

  const handleAssignFeaturedSlot = async (projectId, slot) => {
    const previousProjects = projects;
    const result = assignFeaturedProjectSlot(previousProjects, projectId, slot);
    await persistProjectsState(previousProjects, result.projects, result.changedIds);
  };

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

  const featuredIdsByOrder = filtered
    .filter((project) => project.featured)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((project) => project.id);
  const featuredCount = projects.filter((project) => project.featured).length;

  if (loading) {
    return <div className="admin-loading">加载中…</div>;
  }

  if (loadError) {
    return <div className="admin-loading text-rose-600">{loadError}</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div>
          <p className="admin-kicker">Projects</p>
          <h1>项目管理</h1>
          <p>这里主要处理项目展示顺序、精选位和卡片基础信息，让公开项目页维护更直接。</p>
        </div>
        <Link href="/admin/projects/new" className="admin-button-primary">
          <Plus size={15} />
          新建项目
        </Link>
      </div>

      {error && (
        <div className="admin-panel">
          <div className="admin-panel__body text-sm text-red-600">{error}</div>
        </div>
      )}

      <div className="admin-panel is-strong">
        <div className="admin-toolbar">
        <div className="admin-badge bg-amber-50 px-3 text-sm text-amber-700">
          精选名额 {featuredCount}/{MAX_FEATURED_PROJECTS}
        </div>

        <label className="admin-search">
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索项目名称、ID、简介或技术栈…"
          />
        </label>

        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="admin-select max-w-[180px]"
        >
          <option value="all">全部状态</option>
          <option value="active">进行中</option>
          <option value="building">开发中</option>
          <option value="research">研究中</option>
        </select>
        <span className="ml-auto text-xs text-[var(--admin-text-soft)]">共 {filtered.length} 个项目</span>
        </div>
      </div>

      <div className="admin-panel is-strong admin-table-wrap">
        {filtered.length === 0 ? (
          <div className="admin-empty">未找到项目</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>项目</th>
                <th className="w-20">状态</th>
                <th className="w-24">更新</th>
                <th className="w-24 text-right">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((project) => (
                <tr key={project.id}>
                  <td>
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
                          <button
                            type="button"
                            onClick={() => handleFeaturedToggle(project)}
                            disabled={
                              Boolean(savingMap[project.id]) ||
                              (!project.featured && featuredCount >= MAX_FEATURED_PROJECTS)
                            }
                            className={`rounded p-0.5 transition-colors ${
                              project.featured
                                ? "text-amber-500 hover:text-amber-600"
                                : "text-gray-300 hover:text-gray-500"
                            } disabled:cursor-not-allowed disabled:opacity-50`}
                            title={project.featured ? "取消精选" : "设为精选"}
                            aria-label={project.featured ? "取消精选" : "设为精选"}
                          >
                            <Star
                              size={12}
                              className={project.featured ? "fill-amber-400 text-amber-400" : ""}
                            />
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 truncate">
                          {project.id}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                          {project.summary}
                        </p>
                        {project.featured && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                            <span>首页顺序</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3].map((slot) => {
                                const currentSlot =
                                  featuredIdsByOrder.indexOf(project.id) + 1;
                                const isActive = currentSlot === slot;
                                return (
                                  <button
                                    key={`${project.id}:slot:${slot}`}
                                    type="button"
                                    onClick={() => handleAssignFeaturedSlot(project.id, slot)}
                                    disabled={
                                      Boolean(savingMap[project.id]) ||
                                      isActive ||
                                      featuredIdsByOrder.length < slot
                                    }
                                    className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
                                      isActive
                                        ? "border-rose-300 bg-rose-50 text-rose-600"
                                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-800"
                                    } disabled:cursor-not-allowed disabled:opacity-50`}
                                  >
                                    第{slot}位
                                  </button>
                                );
                              })}
                            </div>
                            <span className="text-[11px] text-gray-400">
                              最多 {MAX_FEATURED_PROJECTS} 个，仅首页展示
                            </span>
                          </div>
                        )}
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
                  <td>
                    <span
                      className={`admin-badge ${
                        STATE_COLOR[project.state] || "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {STATE_LABEL[project.state] || project.state}
                    </span>
                  </td>
                  <td className="text-xs whitespace-nowrap text-[var(--admin-text-soft)]">
                    {fmtDate(project.updatedAt)}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/projects/${project.id}`}
                        className="admin-icon-button h-9 w-9"
                        title="编辑"
                      >
                        <Pencil size={14} className="text-gray-400" />
                      </Link>
                      {project.links?.[0] && (
                        <a
                          href={project.links[0].href}
                          target="_blank"
                          rel="noreferrer"
                          className="admin-icon-button h-9 w-9"
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
