import Image from "next/image";
import Link from "next/link";
import ArgonNavbarClientControls from "@/src/components/argon/ArgonNavbarClientControls";

const navItems = [
  { label: "首页", href: "/", type: "home", title: "查看全部文章与最新更新" },
  {
    label: "前端",
    href: "/blog?category=前端",
    type: "category",
    category: "前端",
    title: "查看前端与 JavaScript 相关文章",
  },
  {
    label: "AI",
    href: "/blog?category=AI",
    type: "category",
    category: "AI",
    title: "查看 AI、大模型与智能体相关文章",
  },
  {
    label: "后端",
    href: "/blog?category=后端",
    type: "category",
    category: "后端",
    title: "查看 Node、Java 与服务端相关文章",
  },
  {
    label: "算法",
    href: "/blog?category=算法",
    type: "category",
    category: "算法",
    title: "查看算法与数据结构相关文章",
  },
  {
    label: "TeamSpeak",
    href: "/blog?category=TeamSpeak",
    type: "category",
    category: "TeamSpeak",
    title: "查看 TeamSpeak 相关内容",
  },
  {
    label: "电脑技巧",
    href: "/blog?category=电脑技巧",
    type: "category",
    category: "电脑技巧",
    title: "查看系统、软件和效率技巧",
  },
  {
    label: "音乐",
    href: "/music",
    type: "music",
    title: "精选音乐歌单分享",
  },
  {
    label: "直播",
    href: "/blog?category=直播",
    type: "category",
    category: "直播",
    title: "查看直播相关内容",
  },
  {
    label: "游戏",
    href: "/blog?category=游戏",
    type: "category",
    category: "游戏",
    title: "查看游戏相关内容",
  },
  {
    label: "资源库",
    href: "/resources",
    type: "resources",
    title: "查看我常用的 AI、开发、网络与效率资源",
  },
  {
    label: "项目",
    href: "/projects",
    type: "projects",
    title: "查看我的项目简介、技术栈与链接",
  },
  { label: "关于本站", href: "/about", type: "about", title: "了解站点定位与更新计划" },
  {
    label: "Cassell",
    href: "https://cassellcollege.com/",
    type: "external",
    title: "卡塞尔学院守夜人论坛 — 哪怕是普通人，也有想守护的东西",
  },
];

function isItemActive(item, pathname, currentCategory, currentTag, currentTopic) {
  if (item.type === "home") return pathname === "/";
  if (item.type === "projects") return pathname === "/projects";
  if (item.type === "resources") return pathname === "/resources";
  if (item.type === "about") return pathname === "/about";
  if (item.type === "music") return pathname === "/music";
  if (item.type === "blog") return pathname === "/blog" && !currentCategory;
  if (item.type === "category") return pathname === "/blog" && currentCategory === item.category;
  if (item.type === "tag") return pathname === "/blog" && currentTag === item.tag;
  if (item.type === "topic") return pathname === "/blog" && currentTopic === item.topic;
  return false;
}

export default function ArgonNavbar({
  currentPath = "/",
  activeCategory = "",
  activeTag = "",
  activeTopic = "",
  activeSearchQuery = "",
}) {
  const currentCategory = String(activeCategory ?? "").trim();
  const currentTag = String(activeTag ?? "").trim();
  const currentTopic = String(activeTopic ?? "").trim().toLowerCase();
  const pathname = String(currentPath || "/").split("?")[0] || "/";

  return (
    <header className="nh-header">
      <nav className="nh-navbar is-top" aria-label="站点导航" data-nh-navbar="true">
        <div className="nh-navbar-inner">
          <div className="nh-navbar-left">
            <Link href="/" className="nh-brand" aria-label="回到首页">
              <Image src="/sakura.png" alt="" width={26} height={26} priority />
            </Link>

            <ul className="nh-nav-list">
              {navItems.map((item) => (
                <li key={`${item.label}:${item.href}`}>
                  {item.type === "external" ? (
                    <a
                      href={item.href}
                      className="nh-nav-link is-external"
                      title={item.title}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Image
                        src="/cassel-crest.png"
                        alt=""
                        width={18}
                        height={18}
                        className="nh-nav-cassel-icon"
                      />
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className={`nh-nav-link ${isItemActive(
                        item,
                        pathname,
                        currentCategory,
                        currentTag,
                        currentTopic
                      ) ? "is-active" : ""}`}
                      title={item.title}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="nh-navbar-right">
            <ArgonNavbarClientControls activeSearchQuery={activeSearchQuery} />
          </div>
        </div>
        <div className="nh-navbar-progress" aria-hidden="true">
          <span data-nh-navbar-progress="true" />
        </div>
      </nav>
    </header>
  );
}
