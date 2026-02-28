import ArgonFooter from "@/src/components/argon/ArgonFooter";
import ArgonLeftbar from "@/src/components/argon/ArgonLeftbar";
import ArgonNavbar from "@/src/components/argon/ArgonNavbar";

export default function ArgonShell({
  posts = [],
  tocItems = [],
  title = "",
  subtitle = "",
  activeCategory = "",
  children,
}) {
  return (
    <div className="nh-page">
      <a className="nh-skip-link" href="#nh-main">
        跳到主内容
      </a>

      <ArgonNavbar activeCategory={activeCategory} />

      <div className="nh-container">
        <div className="nh-layout">
          <ArgonLeftbar posts={posts} tocItems={tocItems} />

          <main id="nh-main" className="nh-main" tabIndex={-1}>
            {title ? (
              <section className="nh-page-head nh-card">
                <h1>{title}</h1>
                {subtitle ? <p>{subtitle}</p> : null}
              </section>
            ) : null}

            {children}

            <ArgonFooter />
          </main>
        </div>
      </div>
    </div>
  );
}
