export default function ArgonFooter() {
  return (
    <footer className="nh-footer nh-card" aria-label="页脚">
      <p>ERII Blog · Built with Next.js · {new Date().getFullYear()}</p>
      <p className="nh-footer-meta">记录前端开发与 AI 实践</p>
    </footer>
  );
}
