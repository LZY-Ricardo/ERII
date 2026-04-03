"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Disc3,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

const EMPTY_FORM = {
  entryId: "",
  name: "",
  description: "",
  platform: "spotify",
  id: "",
  playlistUrl: "",
  coverUrl: "",
  isPublished: true,
  allowEmbeddedPlayer: true,
  sortOrder: 0,
};

function getPlatformLabel(platform) {
  if (platform === "spotify") return "Spotify";
  if (platform === "qq") return "QQ 音乐";
  if (platform === "netease") return "网易云";
  return platform;
}

export default function AdminMusicPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [playlists, setPlaylists] = useState([]);
  const [musicPlayerEnabled, setMusicPlayerEnabled] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState("");

  const reload = async () => {
    const response = await fetch("/api/admin/music", { cache: "no-store" });
    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.error || "加载音乐管理失败");
    }
    setPlaylists(data.playlists ?? []);
    setMusicPlayerEnabled(Boolean(data.musicPlayerEnabled));
  };

  useEffect(() => {
    reload()
      .catch((error) => {
        setMessage({ type: "error", text: error.message || "加载失败" });
      })
      .finally(() => setLoading(false));
  }, []);

  const isSpotify = form.platform === "spotify";
  const sortedPlaylists = useMemo(
    () => [...playlists].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [playlists]
  );

  const setField = (key, value) => {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "platform" && value !== "spotify") {
        next.allowEmbeddedPlayer = false;
      }
      return next;
    });
  };

  const handleTogglePlayer = async () => {
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch("/api/admin/music/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ musicPlayerEnabled: !musicPlayerEnabled }),
      });
      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || "保存播放器设置失败");
      }
      setMusicPlayerEnabled(Boolean(data.musicPlayerEnabled));
      setMessage({ type: "success", text: "播放器开关已更新" });
    } catch (error) {
      setMessage({ type: "error", text: error.message || "保存失败" });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId("");
  };

  const handleEdit = (playlist) => {
    setEditingId(playlist.entryId);
    setForm({
      entryId: playlist.entryId,
      name: playlist.name,
      description: playlist.description ?? "",
      platform: playlist.platform,
      id: playlist.id,
      playlistUrl: playlist.playlistUrl ?? "",
      coverUrl: playlist.coverUrl ?? "",
      isPublished: Boolean(playlist.isPublished),
      allowEmbeddedPlayer: Boolean(playlist.allowEmbeddedPlayer),
      sortOrder: playlist.sortOrder ?? 0,
    });
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm("确认删除这个歌单吗？")) {
      return;
    }

    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch(`/api/admin/music/${encodeURIComponent(entryId)}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || "删除失败");
      }

      await reload();
      if (editingId === entryId) {
        resetForm();
      }
      setMessage({ type: "success", text: "歌单已删除" });
    } catch (error) {
      setMessage({ type: "error", text: error.message || "删除失败" });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch(
        editingId ? `/api/admin/music/${encodeURIComponent(editingId)}` : "/api/admin/music",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || "保存失败");
      }

      await reload();
      resetForm();
      setMessage({ type: "success", text: editingId ? "歌单已更新" : "歌单已创建" });
    } catch (error) {
      setMessage({ type: "error", text: error.message || "保存失败" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="admin-loading">加载中…</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div>
          <p className="admin-kicker">Music</p>
          <h1>音乐管理</h1>
          <p>统一管理 Spotify、QQ 音乐和网易云歌单。站内播放器当前仅支持 Spotify，并受下方开关控制。</p>
        </div>
        {message.text ? (
          <div
            className={`admin-badge min-h-10 px-4 text-sm ${
              message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        ) : null}
      </div>

      <section className="admin-panel is-strong">
        <div className="admin-panel__body">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="admin-kicker">Player</p>
              <h2 className="mt-1 text-xl font-semibold text-[var(--admin-text)]">站内播放器</h2>
              <p className="mt-2 text-sm text-[var(--admin-text-soft)]">
                关闭后，全站右下角播放器和 <code>/music</code> 页内播放器区块都会隐藏，但歌单分享卡片仍然保留。
              </p>
            </div>
            <button
              type="button"
              className={`admin-button-${musicPlayerEnabled ? "primary" : "subtle"}`}
              disabled={saving}
              onClick={handleTogglePlayer}
            >
              {musicPlayerEnabled ? "已启用播放器" : "已关闭播放器"}
            </button>
          </div>
        </div>
      </section>

      <div className="admin-section-grid">
        <section className="admin-panel is-strong">
          <div className="admin-panel__body">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="admin-kicker">Catalog</p>
                <h2 className="m-0 text-xl font-semibold text-[var(--admin-text)]">歌单列表</h2>
              </div>
              <span className="admin-badge bg-stone-100 text-stone-700">共 {sortedPlaylists.length} 条</span>
            </div>

            {sortedPlaylists.length === 0 ? (
              <div className="admin-empty">还没有歌单，先新增一条。</div>
            ) : (
              <div className="admin-list">
                {sortedPlaylists.map((playlist) => (
                  <div key={playlist.entryId} className="admin-list-item">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--admin-text)]">{playlist.name}</span>
                        <span className="admin-badge bg-stone-100 text-stone-700">
                          {getPlatformLabel(playlist.platform)}
                        </span>
                        {!playlist.isPublished ? (
                          <span className="admin-badge bg-stone-100 text-stone-500">未发布</span>
                        ) : null}
                        {playlist.allowEmbeddedPlayer ? (
                          <span className="admin-badge bg-emerald-50 text-emerald-700">可嵌入</span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-[var(--admin-text-soft)]">
                        歌单 ID: {playlist.id} · 排序 {playlist.sortOrder ?? 0}
                      </p>
                      <p className="mt-2 text-sm text-[var(--admin-text-soft)]">{playlist.description || "暂无描述"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="admin-icon-button h-9 w-9"
                        title="编辑"
                        onClick={() => handleEdit(playlist)}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="admin-icon-button h-9 w-9"
                        title="删除"
                        onClick={() => handleDelete(playlist.entryId)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="admin-panel is-strong">
          <div className="admin-panel__body">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="admin-kicker">Editor</p>
                <h2 className="m-0 text-xl font-semibold text-[var(--admin-text)]">
                  {editingId ? "编辑歌单" : "新增歌单"}
                </h2>
              </div>
              {editingId ? (
                <button type="button" className="admin-button-subtle" onClick={resetForm}>
                  取消编辑
                </button>
              ) : null}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">歌单名称</label>
                <input
                  className="admin-input"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="例如：城市夜游歌单"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">平台</label>
                <select
                  className="admin-select"
                  value={form.platform}
                  onChange={(e) => setField("platform", e.target.value)}
                >
                  <option value="spotify">Spotify</option>
                  <option value="qq">QQ 音乐</option>
                  <option value="netease">网易云音乐</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">歌单 ID</label>
                <input
                  className="admin-input"
                  value={form.id}
                  onChange={(e) => setField("id", e.target.value)}
                  placeholder="平台中的歌单 ID"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">描述</label>
                <textarea
                  className="admin-textarea"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="歌单说明"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">外链 URL</label>
                <input
                  className="admin-input"
                  value={form.playlistUrl}
                  onChange={(e) => setField("playlistUrl", e.target.value)}
                  placeholder="为空时自动按平台生成"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">封面 URL</label>
                <input
                  className="admin-input"
                  value={form.coverUrl}
                  onChange={(e) => setField("coverUrl", e.target.value)}
                  placeholder="可选"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">排序</label>
                <input
                  type="number"
                  className="admin-input"
                  value={form.sortOrder}
                  onChange={(e) => setField("sortOrder", Number(e.target.value))}
                  placeholder="0"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setField("isPublished", e.target.checked)}
                  className="mt-0.5 h-4 w-4"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">发布到 `/music` 页面</span>
                  <p className="mt-0.5 text-xs text-gray-400">关闭后仍保留在后台，但不会对访客展示。</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allowEmbeddedPlayer}
                  disabled={!isSpotify}
                  onChange={(e) => setField("allowEmbeddedPlayer", e.target.checked)}
                  className="mt-0.5 h-4 w-4"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">允许进入站内播放器候选</span>
                  <p className="mt-0.5 text-xs text-gray-400">
                    当前仅 Spotify 支持站内播放，QQ 音乐和网易云只做分享与外链展示。
                  </p>
                </div>
              </label>

              <div className="flex justify-end gap-3">
                <button type="button" className="admin-button-subtle" onClick={resetForm}>
                  <Plus size={14} />
                  清空
                </button>
                <button type="submit" disabled={saving} className="admin-button-primary">
                  <Save size={14} />
                  {editingId ? "保存修改" : "创建歌单"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>

      <section className="admin-panel">
        <div className="admin-panel__body flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Disc3 size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--admin-text)]">当前站内播放器约束</p>
            <p className="mt-1 text-sm text-[var(--admin-text-soft)]">
              全站 dock 和 `/music` 页播放器都只会消费已发布、可嵌入的 Spotify 歌单。
              QQ 音乐与网易云音乐会继续作为分享卡片展示，但不会进入站内播放器。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
