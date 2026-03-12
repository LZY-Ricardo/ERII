import "./globals.css";
import { ToastProvider } from "@/src/components/Toast";

export const metadata = {
  title: "象龟的水坑 | 技术与生活",
  description: "分享前端开发与 AI 实践的个人博客。",
  icons: {
    icon: "/sakura.png",
    apple: "/sakura.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body className="nh-body antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

