import "./globals.css";

export const metadata = {
  title: "ERII | 卡塞尔档案馆",
  description: "龙族灵感主题下的个人博客档案馆。",
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
