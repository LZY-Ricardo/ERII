import Link from "next/link";

const navItems = [
  { label: "首页", href: "/" },
  { label: "文章", href: "/blog" },
  { label: "关于", href: "/about" },
];

export default function Header() {
  return (
    <header className="flex items-center justify-between gap-4 py-6 border-b border-dashed border-erii-red/25">
      <Link
        href="/"
        className="font-hand text-2xl text-erii-ink hover:text-erii-red transition-colors"
      >
        绘梨衣的写字板
      </Link>
      <nav className="flex items-center gap-6 text-sm font-hand text-erii-ink">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="hover:text-erii-red transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
