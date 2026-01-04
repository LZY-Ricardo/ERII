import Link from "next/link";
import { SakuraIcon } from "./icons";

const navItems = [
  { label: "首页", href: "/" },
  { label: "文章", href: "/blog" },
  { label: "关于", href: "/about" },
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
      <nav className="flex items-center gap-6 text-sm font-sans text-wafu-sumi/80">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="transition-colors hover:text-wafu-shu"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
