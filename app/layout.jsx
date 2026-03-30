import "./globals.css";
import { ToastProvider } from "@/src/components/Toast";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

const SITE_URL = "https://blog.sunandyu.top";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "象龟的水坑 | 个人知识分享 - 前端、AI 与开发实践",
    template: "%s | 象龟的水坑",
  },
  description:
    "象龟的水坑是 Ricardo 的个人博客，分享前端开发、AI 应用、后端实践、个人项目与精选工具推荐，持续更新技术笔记与踩坑总结。",
  keywords: [
    "个人博客",
    "前端开发",
    "AI 实践",
    "Next.js",
    "React",
    "TypeScript",
    "工具推荐",
    "Ricardo",
    "象龟的水坑",
  ],
  authors: [{ name: "Ricardo", url: SITE_URL }],
  creator: "Ricardo",
  publisher: "Ricardo",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: SITE_URL,
    siteName: "象龟的水坑",
    title: "象龟的水坑 | 个人知识分享 - 前端、AI 与开发实践",
    description:
      "Ricardo 的个人博客，分享前端开发、AI 应用、后端实践、个人项目与精选工具推荐。",
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: "/sakura.png",
    apple: "/sakura.png",
  },
  other: {
    "format-detection": "telephone=no",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body className="nh-body antialiased" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("nh:theme:dark-mode")==="dark")document.body.classList.add("nh-dark")}catch(e){}`,
          }}
        />
        <ToastProvider>{children}</ToastProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

