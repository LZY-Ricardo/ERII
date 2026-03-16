import ArgonFooter from "@/src/components/argon/ArgonFooter";
import ArgonLeftbar from "@/src/components/argon/ArgonLeftbar";
import ArgonNavbar from "@/src/components/argon/ArgonNavbar";
import ArgonRightbar from "@/src/components/argon/ArgonRightbar";
import UnmarkFloatingPrompt from "@/src/components/argon/UnmarkFloatingPrompt";

export default function ArgonShell({
  posts = [],
  tocItems = [],
  articleSidebar = null,
  title = "",
  subtitle = "",
  titleMode = "card",
  activeCategory = "",
  activeTag = "",
  activeTopic = "",
  activeSearchQuery = "",
  children,
}) {
  const isHeroTitle = titleMode === "hero";

  return (
    <div className="nh-page">
      <a className="nh-skip-link" href="#nh-main">
        跳到主内容
      </a>

      <ArgonNavbar
        activeCategory={activeCategory}
        activeTag={activeTag}
        activeTopic={activeTopic}
        activeSearchQuery={activeSearchQuery}
      />

      <div className="nh-container">
        <div className="nh-layout">
          {isHeroTitle && title ? (
            <section className="nh-page-head nh-page-hero">
              <h1>{title}</h1>
              {subtitle ? <p>{subtitle}</p> : null}
            </section>
          ) : null}

          <ArgonLeftbar posts={posts} tocItems={tocItems} activeSearchQuery={activeSearchQuery} />

          <main id="nh-main" className="nh-main" tabIndex={-1}>
            {!isHeroTitle && title ? (
              <section className="nh-page-head nh-card">
                <h1>{title}</h1>
                {subtitle ? <p>{subtitle}</p> : null}
              </section>
            ) : null}

            {children}

            <ArgonFooter />
          </main>

          <ArgonRightbar posts={posts} tocItems={tocItems} articleSidebar={articleSidebar} />
        </div>
      </div>

      <UnmarkFloatingPrompt />
    </div>
  );
}
