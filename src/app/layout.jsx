import {
  JetBrains_Mono,
  Noto_Serif_JP,
  Noto_Serif_SC,
  Patrick_Hand,
  ZCOOL_KuaiLe,
  Zen_Maru_Gothic,
} from "next/font/google";
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

const serifJP = Noto_Serif_JP({
  weight: ["400", "700"],
  subsets: ["latin", "japanese"],
  variable: "--font-serif-jp",
});

const serifSC = Noto_Serif_SC({
  weight: ["400", "700"],
  subsets: ["latin", "chinese-simplified"],
  variable: "--font-serif-sc",
});

const zenMaru = Zen_Maru_Gothic({
  weight: ["400", "700"],
  subsets: ["latin", "japanese"],
  variable: "--font-ui",
});

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body
        className={`${patrickHand.variable} ${zcool.variable} ${serifJP.variable} ${serifSC.variable} ${zenMaru.variable} ${jetbrainsMono.variable} erii-paper font-sans bg-wafu-paper bg-washi-texture bg-repeat bg-fixed text-wafu-sumi antialiased selection:bg-wafu-sakura selection:text-wafu-shu`}
      >
        {children}
        <Footer />
      </body>
    </html>
  );
}
