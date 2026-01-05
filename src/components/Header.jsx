import Link from "next/link";
import { SakuraIcon, HomeIcon, BlogIcon, AboutIcon } from "./icons";

const navItems = [
  { label: "首页", href: "/", icon: HomeIcon },
  { label: "文章", href: "/blog", icon: BlogIcon },
  { label: "关于", href: "/about", icon: AboutIcon },
];

export default function Header() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-dashed border-wafu-sumi/15 py-6">
      <Link
        href="/"
        className="group inline-flex items-center gap-2 leading-tight"
      >
        <SakuraIcon className="h-6 w-6 drop-shadow-sm" />
        <span className="font-serif text-2xl text-wafu-sumi transition-colors group-hover:text-wafu-shu">
          絵梨衣の日記
        </span>
      </Link>
      <nav className="flex items-center gap-3 text-wafu-sumi/80">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group relative overflow-hidden rounded-lg"
              title={item.label}
            >
              {/* 绘马卡片容器 */}
              <div className="relative h-10 w-16">
                {/* 图标层 - hover时向上滑出 */}
                <div className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out group-hover:-translate-y-full">
                  <Icon className="h-6 w-6" />
                </div>
                {/* 文字层 - hover时从下方滑入 */}
                <div className="absolute inset-0 flex items-center justify-center translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0">
                  <div className="flex items-center gap-2 rounded bg-wafu-paper/90 px-2 py-1 shadow-sm">
                    {/* 朱红色竖线 - 像日文标注线，放在文字左侧 */}
                    <span className="h-3 w-0.5 bg-[#ff4d40]/60" />
                    <span className="font-serif text-sm text-wafu-sumi">
                      {item.label}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
