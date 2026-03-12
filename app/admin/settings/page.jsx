"use client";

import { useState, useEffect } from "react";
import {
  User,
  Globe,
  Mail,
  Palette,
  Save,
  Bell,
  Shield,
  Database,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [settings, setSettings] = useState({
    // 站点基本信息
    siteName: "",
    siteUrl: "",
    authorName: "",
    authorEmail: "",

    // 外观
    theme: "light",
    primaryColor: "rose",

    // 评论设置
    commentsEnabled: true,
    commentModeration: true,
    spamFilterEnabled: true,

    // 通知设置
    emailNotifications: false,
    notificationEmail: "",

    // 高级设置
    maintenanceMode: false,
  });

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();

      if (data.ok) {
        setMessage({ type: "success", text: "设置已保存" });
      } else {
        setMessage({ type: "error", text: data.error || "保存失败" });
      }
    } catch {
      setMessage({ type: "error", text: "网络错误" });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400 text-sm">
        加载中…
      </div>
    );
  }

  const sections = [
    {
      title: "站点信息",
      icon: Globe,
      fields: [
        {
          key: "siteName",
          label: "站点名称",
          type: "text",
          placeholder: "我的博客",
        },
        {
          key: "siteUrl",
          label: "站点地址",
          type: "url",
          placeholder: "https://example.com",
        },
        {
          key: "authorName",
          label: "作者名称",
          type: "text",
          placeholder: "你的名字",
        },
        {
          key: "authorEmail",
          label: "联系邮箱",
          type: "email",
          placeholder: "contact@example.com",
        },
      ],
    },
    {
      title: "外观",
      icon: Palette,
      fields: [
        {
          key: "theme",
          label: "主题",
          type: "select",
          options: [
            { value: "light", label: "浅色" },
            { value: "dark", label: "深色" },
            { value: "auto", label: "跟随系统" },
          ],
        },
        {
          key: "primaryColor",
          label: "主题色",
          type: "select",
          options: [
            { value: "rose", label: "玫瑰红" },
            { value: "blue", label: "蓝色" },
            { value: "emerald", label: "翠绿" },
            { value: "amber", label: "琥珀" },
            { value: "violet", label: "紫罗兰" },
          ],
        },
      ],
    },
    {
      title: "评论设置",
      icon: Bell,
      fields: [
        {
          key: "commentsEnabled",
          label: "启用评论",
          type: "checkbox",
          description: "允许访客在文章下发表评论",
        },
        {
          key: "commentModeration",
          label: "评论审核",
          type: "checkbox",
          description: "新评论需要经过审核才能显示",
        },
        {
          key: "spamFilterEnabled",
          label: "垃圾评论过滤",
          type: "checkbox",
          description: "自动检测并标记可疑评论",
        },
      ],
    },
    {
      title: "通知设置",
      icon: Mail,
      fields: [
        {
          key: "emailNotifications",
          label: "邮件通知",
          type: "checkbox",
          description: "收到新评论时发送邮件通知",
        },
        {
          key: "notificationEmail",
          label: "通知邮箱",
          type: "email",
          placeholder: "noreply@example.com",
        },
      ],
    },
    {
      title: "高级设置",
      icon: Shield,
      fields: [
        {
          key: "maintenanceMode",
          label: "维护模式",
          type: "checkbox",
          description: "启用后站点将显示维护页面",
        },
      ],
    },
  ];

  function renderField(field) {
    const value = settings[field.key];
    const setValue = (v) =>
      setSettings((prev) => ({ ...prev, [field.key]: v }));

    if (field.type === "checkbox") {
      return (
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => setValue(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">
              {field.label}
            </span>
            {field.description && (
              <p className="text-xs text-gray-400 mt-0.5">{field.description}</p>
            )}
          </div>
        </label>
      );
    }

    if (field.type === "select") {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {field.label}
          </label>
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm
              text-gray-700 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          >
            {field.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {field.label}
        </label>
        <input
          type={field.type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={field.placeholder}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm
            text-gray-700 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100
            placeholder:text-gray-400"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">设置</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            管理你的站点配置和偏好设置
          </p>
        </div>
        {message.text && (
          <div
            className={`text-sm px-4 py-2 rounded-lg ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.title}
              className="rounded-xl border border-gray-200 bg-white"
            >
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                <Icon size={16} className="text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-700">
                  {section.title}
                </h2>
              </div>
              <div className="p-5 space-y-4">
                {section.fields.map((field) => (
                  <div key={field.key}>{renderField(field)}</div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Submit button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700
              disabled:bg-gray-300 text-white text-sm font-medium rounded-lg
              transition-colors"
          >
            <Save size={16} />
            {saving ? "保存中…" : "保存设置"}
          </button>
        </div>
      </form>
    </div>
  );
}
