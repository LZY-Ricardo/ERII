"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useMemo } from "react";

export default function ArgonSharePanel({ post }) {
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

  return (
    <section className="nh-share-shell nh-card" aria-label="文章分享">
      <h2>分享到微信</h2>
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
        <Link href={path} className="nh-chip">
          复制链接
        </Link>
      </div>
    </section>
  );
}
