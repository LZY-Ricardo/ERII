export function isGitHubAction(action) {
  const href = String(action?.href ?? "").trim().toLowerCase();
  const label = String(action?.label ?? "").trim().toLowerCase();
  return href.includes("github.com") || label.includes("github");
}

export function isLiveAction(action) {
  const href = String(action?.href ?? "").trim().toLowerCase();
  if (/^https?:\/\//.test(href) && !isGitHubAction(action)) return true;

  const label = String(action?.label ?? "").trim().toLowerCase();
  return /live|preview|demo|在线|预览|体验/.test(label);
}

export function groupProjectActions(actions = []) {
  const links = Array.isArray(actions) ? actions.slice(0, 3) : [];
  const liveAction = links.find((item) => isLiveAction(item)) ?? null;
  const githubAction = links.find((item) => isGitHubAction(item)) ?? null;
  const otherActions = links.filter((item) => item !== liveAction && item !== githubAction);

  return { liveAction, githubAction, otherActions };
}
