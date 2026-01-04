import { Patrick_Hand, ZCOOL_KuaiLe } from "next/font/google";
import "./globals.css";
import Footer from "../components/Footer";

const patrickHand = Patrick_Hand({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-hand",
});

const zcool = ZCOOL_KuaiLe({
  weight: "400",
  subsets: ["chinese-simplified"],
  variable: "--font-cn",
});

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body
        className={`${patrickHand.variable} ${zcool.variable} erii-paper font-hand bg-erii-paper bg-paper-texture bg-repeat bg-fixed text-erii-ink antialiased selection:bg-erii-duck selection:text-erii-red`}
      >
        {children}
        <Footer />
      </body>
    </html>
  );
}
