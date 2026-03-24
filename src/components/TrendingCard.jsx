import Image from "next/image";
import Link from "next/link";

const formatNumber = (num) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export function TrendingList({ repos, period = "weekly" }) {
  if (!repos || repos.length === 0) {
    return (
      <div className="nh-trending-empty">
        <p>暂无热点数据</p>
      </div>
    );
  }

  return (
    <div className="nh-trending-list">
      {repos.map((repo, index) => (
        <TrendingCard key={repo.id} repo={repo} rank={index + 1} period={period} />
      ))}
    </div>
  );
}

function TrendingCard({ repo, rank, period }) {
  return (
    <article className="nh-trending-card nh-card">
      <div className="nh-trending-header">
        <span className="nh-trending-rank" data-rank={rank}>
          {rank}
        </span>
        <div className="nh-trending-avatar">
          {repo.avatar ? (
            <Image src={repo.avatar} alt={repo.owner} width={48} height={48} />
          ) : (
            <span className="nh-trending-avatar-fallback" />
          )}
        </div>
        <div className="nh-trending-info">
          <div className="nh-trending-title-row">
            <h3 className="nh-trending-title">
              <Link href={repo.url} target="_blank" rel="noreferrer">
                {repo.owner}/<strong>{repo.name}</strong>
              </Link>
            </h3>
          </div>
          <p className="nh-trending-description">{repo.description}</p>
        </div>
      </div>

      <div className="nh-trending-meta">
        {repo.language && (
          <span className="nh-trending-language">
            <span className="nh-lang-dot" data-lang={repo.language} />
            {repo.language}
          </span>
        )}
        <span className="nh-trending-stat" title="Stars">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z" />
          </svg>
          {formatNumber(repo.stars)}
        </span>
        <span className="nh-trending-stat" title="Forks">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z" />
          </svg>
          {formatNumber(repo.forks)}
        </span>
        {repo.periodStars > 0 && (
          <span className="nh-trending-period-stars" title={`${period === 'monthly' ? '本月' : '本周'}新增`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M8 12a.75.75 0 01-.75-.75V4.56L4.03 7.78a.75.75 0 01-1.06-1.06l4.5-4.5a.75.75 0 011.06 0l4.5 4.5a.75.75 0 11-1.06 1.06L8.75 4.56v6.69A.75.75 0 018 12z" />
            </svg>
            {formatNumber(repo.periodStars)}
          </span>
        )}
      </div>
    </article>
  );
}
