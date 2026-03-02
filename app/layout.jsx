import "./globals.css";

export const metadata = {
  title: "ERII | 前端与 AI 博客",
  description: "分享前端开发与 AI 实践的个人博客。",
  icons: {
    icon: "/sakura.png",
    apple: "/sakura.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body className="nh-body antialiased">{children}</body>
    </html>
  );
}
