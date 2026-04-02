"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  FEATURED_PROJECT_LIMIT_ERROR,
  MAX_FEATURED_PROJECTS,
} from "@/src/lib/projectFeaturedLimit";
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  X,
  Star,
  Upload,
  Loader2,
} from "lucide-react";

const STATE_OPTIONS = [
  { value: "active", label: "进行中" },
  { value: "building", label: "开发中" },
  { value: "research", label: "研究中" },
];

const FOCUS_OPTIONS = [
  { value: "frontend", label: "前端" },
  { value: "ai", label: "AI" },
  { value: "tooling", label: "工具链" },
];

function emptyProject() {
  return {
    id: "",
    name: "",
    tagline: "",
    summary: "",
    status: "",
    state: "active",
    focus: [],
    tech: [],
    cover: "",
    featured: false,
    links: [],
    sortOrder: 0,
  };
}

export default function AdminProjectEditPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id;

  const isNew = projectId === "new";
  const [project, setProject] = useState(emptyProject());
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showCoverPreview, setShowCoverPreview] = useState(false);
  const [techInput, setTechInput] = useState("");
  const [featuredCount, setFeaturedCount] = useState(0);
  const fileInputRef = useRef(null);

  // 加载项目数据
  useEffect(() => {
    if (isNew) {
      setLoading(false);
    }

    fetch("/api/admin/projects")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setFeaturedCount(
            (data.projects ?? []).filter((item) => item.featured).length
          );
        }
      })
      .catch(() => {});

    if (isNew) {
      return;
    }

    fetch(`/api/admin/projects/${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setProject(data.project);
        } else {
          setError(data.error || "加载失败");
        }
      })
      .catch(() => setError("网络错误"))
      .finally(() => setLoading(false));
  }, [projectId, isNew]);

  useEffect(() => {
    setShowCoverPreview(Boolean(project.cover));
  }, [project.cover]);

  const handleChange = (field, value) => {
    if (
      field === "featured" &&
      value === true &&
      !project.featured &&
      featuredCount >= MAX_FEATURED_PROJECTS
    ) {
      setError(FEATURED_PROJECT_LIMIT_ERROR);
      return;
    }

    if (field === "featured") {
      setError("");
    }
    setProject((p) => ({ ...p, [field]: value }));
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("prefix", "images/projects");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.ok) {
        handleChange("cover", data.url);
      } else {
        setError(data.error || "上传失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setUploading(false);
    }
  };

  const toggleFocus = (focus) => {
    setProject((p) => ({
      ...p,
      focus: p.focus?.includes(focus)
        ? p.focus.filter((f) => f !== focus)
        : [...(p.focus || []), focus],
    }));
  };

  const addTech = () => {
    if (techInput.trim() && !project.tech?.includes(techInput.trim())) {
      setProject((p) => ({
        ...p,
        tech: [...(p.tech || []), techInput.trim()],
      }));
      setTechInput("");
    }
  };

  const removeTech = (tech) => {
    setProject((p) => ({
      ...p,
      tech: p.tech?.filter((t) => t !== tech) ?? [],
    }));
  };

  const updateLink = (index, field, value) => {
    setProject((p) => ({
      ...p,
      links: p.links?.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      ) ?? [],
    }));
  };

  const addLink = () => {
    setProject((p) => ({
      ...p,
      links: [...(p.links || []), { label: "", href: "", external: true }],
    }));
  };

  const removeLink = (index) => {
    setProject((p) => ({
      ...p,
      links: p.links?.filter((_, i) => i !== index) ?? [],
    }));
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);

    try {
      const url = isNew ? "/api/admin/projects" : `/api/admin/projects/${project.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
      });

      const data = await res.json();

      if (data.ok) {
        router.push("/admin/projects");
      } else {
        setError(data.error || "保存失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew) return;
    if (!confirm("确定要删除这个项目吗？此操作不可恢复。")) return;

    try {
      const res = await fetch(`/api/admin/projects/${project.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.ok) {
        router.push("/admin/projects");
      } else {
        setError(data.error || "删除失败");
      }
    } catch {
      setError("网络错误");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400 text-sm">
        加载中…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/projects"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">
          {isNew ? "新建项目" : "编辑项目"}
        </h1>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-6">
        {/* ID */}
        <div className="grid grid-cols-[120px_1fr] items-start gap-4">
          <label className="text-sm font-medium text-gray-700 pt-2">
            项目 ID
          </label>
          <input
            value={project.id}
            onChange={(e) => handleChange("id", e.target.value)}
            placeholder="project-id"
            disabled={!isNew}
            className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm
              outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100
              ${!isNew ? "bg-gray-50 text-gray-500 cursor-not-allowed" : ""}`}
          />
        </div>

        {/* Name */}
        <div className="grid grid-cols-[120px_1fr] items-start gap-4">
          <label className="text-sm font-medium text-gray-700 pt-2">
            项目名称
          </label>
          <input
            value={project.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="项目名称"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm
              outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          />
        </div>

        {/* Tagline */}
        <div className="grid grid-cols-[120px_1fr] items-start gap-4">
          <label className="text-sm font-medium text-gray-700 pt-2">
            一句话描述
          </label>
          <input
            value={project.tagline}
            onChange={(e) => handleChange("tagline", e.target.value)}
            placeholder="简短描述"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm
              outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          />
        </div>

        {/* Summary */}
        <div className="grid grid-cols-[120px_1fr] items-start gap-4">
          <label className="text-sm font-medium text-gray-700 pt-2">
            详细介绍
          </label>
          <textarea
            value={project.summary}
            onChange={(e) => handleChange("summary", e.target.value)}
            placeholder="项目详细介绍"
            rows={3}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm
              outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 resize-none"
          />
        </div>

        {/* Cover */}
        <div className="grid grid-cols-[120px_1fr] items-start gap-4">
          <label className="text-sm font-medium text-gray-700 pt-2">
            封面图片
          </label>
          <div className="flex-1 space-y-3">
            <div className="flex gap-2">
              <input
                value={project.cover}
                onChange={(e) => handleChange("cover", e.target.value)}
                placeholder="/images/projects/xxx.png"
                className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm
                  outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-sm
                  text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    上传中
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    上传
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
              />
            </div>
            {project.cover && showCoverPreview && (
              <div className="flex gap-3">
                <Image
                  src={project.cover}
                  alt="封面预览"
                  width={192}
                  height={108}
                  unoptimized
                  className="w-48 h-27 rounded-lg object-cover bg-gray-100"
                  onError={() => setShowCoverPreview(false)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Status & State */}
        <div className="grid grid-cols-[120px_1fr_1fr] items-start gap-4">
          <label className="text-sm font-medium text-gray-700 pt-2">
            状态
          </label>
          <input
            value={project.status}
            onChange={(e) => handleChange("status", e.target.value)}
            placeholder="如：持续更新、维护中"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm
              outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          />
          <select
            value={project.state}
            onChange={(e) => handleChange("state", e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm
              outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          >
            {STATE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Featured */}
        <div className="grid grid-cols-[120px_1fr] items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            精选项目
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleChange("featured", !project.featured)}
              disabled={
                !project.featured && featuredCount >= MAX_FEATURED_PROJECTS
              }
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                project.featured
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <Star
                size={15}
                className={project.featured ? "fill-amber-400 text-amber-400" : ""}
              />
              {project.featured ? "已精选" : "设为精选"}
            </button>
            <span className="text-xs text-gray-400">
              精选名额 {featuredCount}/{MAX_FEATURED_PROJECTS}
            </span>
          </div>
        </div>

        {/* Focus */}
        <div className="grid grid-cols-[120px_1fr] items-start gap-4">
          <label className="text-sm font-medium text-gray-700 pt-2">
            项目分类
          </label>
          <div className="flex flex-wrap gap-2">
            {FOCUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleFocus(opt.value)}
                className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                  project.focus?.includes(opt.value)
                    ? "bg-rose-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="grid grid-cols-[120px_1fr] items-start gap-4">
          <label className="text-sm font-medium text-gray-700 pt-2">
            技术栈
          </label>
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <input
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTech())}
                placeholder="输入技术栈后回车"
                className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm
                  outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
              />
              <button
                onClick={addTech}
                className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-sm
                  text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <Plus size={15} />
                添加
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(project.tech ?? []).map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100
                    px-2.5 py-1 text-sm text-gray-700"
                >
                  {tech}
                  <button
                    onClick={() => removeTech(tech)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-[120px_1fr] items-start gap-4">
          <label className="text-sm font-medium text-gray-700 pt-2">
            相关链接
          </label>
          <div className="flex-1 space-y-3">
            {(project.links ?? []).map((link, index) => (
              <div key={index} className="flex gap-2 items-start">
                <input
                  value={link.label}
                  onChange={(e) => updateLink(index, "label", e.target.value)}
                  placeholder="链接名称"
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm
                    outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                />
                <input
                  value={link.href}
                  onChange={(e) => updateLink(index, "href", e.target.value)}
                  placeholder="https://..."
                  className="flex-[2] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm
                    outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                />
                <button
                  onClick={() => removeLink(index)}
                  className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <button
              onClick={addLink}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-rose-500 transition-colors"
            >
              <Plus size={15} />
              添加链接
            </button>
          </div>
        </div>

        {/* Sort Order */}
        <div className="grid grid-cols-[120px_1fr] items-start gap-4">
          <label className="text-sm font-medium text-gray-700 pt-2">
            排序顺序
          </label>
          <input
            type="number"
            value={project.sortOrder}
            onChange={(e) => handleChange("sortOrder", parseInt(e.target.value) || 0)}
            className="w-32 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm
              outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleDelete}
          disabled={isNew}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-colors ${
            isNew
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-red-50 text-red-600 hover:bg-red-100"
          }`}
        >
          <Trash2 size={15} />
          删除项目
        </button>

        <div className="flex gap-3">
          <Link
            href="/admin/projects"
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700
              hover:bg-gray-50 transition-colors"
          >
            取消
          </Link>
          <button
            onClick={handleSave}
            disabled={saving || !project.id || !project.name}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-colors ${
              saving || !project.id || !project.name
                ? "bg-gray-300 text-white cursor-not-allowed"
                : "bg-rose-500 text-white hover:bg-rose-600"
            }`}
          >
            <Save size={15} />
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
