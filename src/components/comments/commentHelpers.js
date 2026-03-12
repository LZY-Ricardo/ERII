export const PAGE_SIZE = 20;

export function safeText(value) {
  return String(value ?? "");
}

export function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("zh-CN", { hour12: false });
}

export function toPreview(content) {
  const compact = safeText(content).replace(/\s+/g, " ").trim();
  if (!compact) return "（空内容）";
  if (compact.length <= 72) return compact;
  return `${compact.slice(0, 72)}...`;
}

export function isSafeLink(href) {
  return /^https?:\/\//i.test(String(href ?? ""));
}

export function avatarColor(name) {
  const text = safeText(name) || "访客";
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 44% 44%)`;
}

export function cloneAndUpdateVote(nodes, commentId, voteCount) {
  return nodes.map((node) => {
    if (node.id === commentId) {
      return { ...node, voteCount };
    }
    if (!node.children?.length) return node;
    return {
      ...node,
      children: cloneAndUpdateVote(node.children, commentId, voteCount),
    };
  });
}
