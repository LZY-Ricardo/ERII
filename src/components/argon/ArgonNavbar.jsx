import Image from "next/image";
import Link from "next/link";

const navItems = [
  { label: "首页", href: "/" },
  { label: "执行部", href: "/blog?category=TeamSpeak" },
  { label: "装备部", href: "/blog?category=电脑技巧" },
  { label: "夜航局", href: "/blog?category=直播" },
  { label: "实战课", href: "/blog?category=游戏" },
  { label: "档案馆", href: "/blog" },
  { label: "关于", href: "/about" },
];

export default function ArgonNavbar() {
  return (
    <header className="nh-header">
      <nav className="nh-navbar" aria-label="站点导航">
        <div className="nh-navbar-inner">
          <Link href="/" className="nh-brand" aria-label="回到首页">
            <Image src="/sakura.png" alt="" width={28} height={28} priority />
            <span>ERII · 卡塞尔档案馆</span>
          </Link>

          <ul className="nh-nav-list">
            {navItems.map((item) => (
              <li key={`${item.label}:${item.href}`}>
                <Link href={item.href} className="nh-nav-link">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
