import Link from "next/link";

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
        className="group inline-flex flex-col leading-tight"
      >
        <span className="font-serif text-2xl text-wafu-sumi transition-colors group-hover:text-wafu-shu">
          绘梨衣的写字板
        </span>
        <span className="mt-1 font-sans text-[11px] tracking-[0.35em] text-wafu-sumi/55">
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
