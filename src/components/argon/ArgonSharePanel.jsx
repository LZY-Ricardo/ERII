"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState } from "react";
import { useToast } from "@/src/components/Toast";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function ArgonSharePanel({ post }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const title = encodeURIComponent(String(post?.frontmatter?.title ?? "文章"));
  const path = `/blog/${encodeURIComponent(post?.slug ?? "")}`;
  const shareUrl = encodeURIComponent(path);

  // 生成完整的分享URL（用于二维码）
  const fullShareUrl = useMemo(() => {
    // 优先使用环境变量配置的站点 URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (siteUrl) {
      return `${siteUrl}${path}`;
    }

    // 降级使用当前页面 origin
    if (typeof window !== "undefined") {
      return `${window.location.origin}${path}`;
    }

    return path;
  }, [path]);

  // 复制链接到剪贴板
  const handleCopyLink = async () => {
    try {
      // 使用现代 Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullShareUrl);
      } else {
        // 降级方案：使用传统方法
        const textArea = document.createElement("textarea");
        textArea.value = fullShareUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand("copy");
        } catch (err) {
          throw new Error("复制失败");
        }
        document.body.removeChild(textArea);
      }

      // 显示成功提示
      setCopied(true);
      toast.success("链接已复制到剪贴板！");

      // 2秒后恢复按钮文本
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      toast.error("复制失败，请手动复制链接");
      console.error("复制失败:", error);
    }
  };

  return (
    <section className="nh-share-shell nh-card" aria-label="文章分享">
      {/* 折叠状态：只显示一个小按钮 */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="nh-share-toggle"
          style={{
            width: "100%",
            padding: "12px 16px",
            background: "transparent",
            border: "1px dashed rgba(0, 0, 0, 0.15)",
            borderRadius: "12px",
            color: "rgba(54, 72, 99, 0.6)",
            cursor: "pointer",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0, 0, 0, 0.03)";
            e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.15)";
          }}
        >
          <ChevronDown size={16} />
          分享文章
        </button>
      ) : (
        // 展开状态：显示完整分享面板
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <h2 style={{ margin: 0, fontSize: "16px" }}>分享文章</h2>
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(54, 72, 99, 0.5)",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center"
              }}
            >
              <ChevronUp size={18} />
            </button>
          </div>

          <div className="nh-share-grid">
            <div className="nh-share-qr" aria-hidden="true">
              <QRCodeSVG
                value={fullShareUrl}
                size={74}
                level="M"
                bgColor="transparent"
              />
            </div>
            <p>微信扫描二维码</p>
          </div>

          <div className="nh-share-links">
            <a
              href={`https://service.weibo.com/share/share.php?url=${shareUrl}&title=${title}`}
              target="_blank"
              rel="noreferrer"
              className="nh-chip"
            >
              微博
            </a>
            <a
              href={`http://shuo.douban.com/!service/share?href=${shareUrl}&name=${title}`}
              target="_blank"
              rel="noreferrer"
              className="nh-chip"
            >
              豆
            </a>
            <button
              onClick={handleCopyLink}
              className="nh-chip"
              style={{
                background: copied ? "rgba(0, 200, 83, 0.1)" : "",
                color: copied ? "#00c853" : "",
                border: copied ? "1px solid rgba(0, 200, 83, 0.3)" : "",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {copied ? "✓ 已复制" : "复制链接"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
