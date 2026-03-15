function normalizeString(value) {
  if (value == null) return "";
  if (Array.isArray(value)) return String(value[0] ?? "");
  return String(value);
}

function normalizeProtocol(value) {
  const raw = normalizeString(value).trim().toLowerCase();
  if (raw === "ts3server") return "ts3server";
  return "teamspeak";
}

function appendQuery(params, key, value) {
  const normalized = normalizeString(value).trim();
  if (!normalized) return;
  params.set(key, normalized);
}

/**
 * Build a TeamSpeak custom-protocol URI that can be handled by the local client.
 * Supported inputs:
 * - Invite: teamspeak://invite=XXXX
 * - Direct server: teamspeak://host?port=...&channel=...
 * - TS3 server: ts3server://host?port=...&channel=...
 */
export function buildTeamSpeakUri(input = {}) {
  const protocol = normalizeProtocol(input.protocol);
  const invite = normalizeString(input.invite).trim();

  if (invite) {
    // Keep it simple and robust: invite code goes in the path segment.
    return `teamspeak://invite=${encodeURIComponent(invite)}`;
  }

  const host = normalizeString(input.host || input.server).trim();
  if (!host) return "";

  const params = new URLSearchParams();
  appendQuery(params, "port", input.port);
  appendQuery(params, "nickname", input.nickname);
  appendQuery(params, "password", input.password);
  appendQuery(params, "channel", input.channel);
  appendQuery(params, "channelpassword", input.channelPassword || input.channelpassword);

  const query = params.toString();
  return `${protocol}://${host}${query ? `?${query}` : ""}`;
}

/**
 * Build an internal https URL that redirects to the TeamSpeak custom-protocol URI.
 * This avoids putting `teamspeak://` directly in Markdown/MDX (some renderers sanitize it).
 */
export function buildTeamSpeakRedirectHref(input = {}) {
  const protocol = normalizeProtocol(input.protocol);
  const invite = normalizeString(input.invite).trim();
  const host = normalizeString(input.host || input.server).trim();

  const params = new URLSearchParams();
  appendQuery(params, "protocol", protocol);
  appendQuery(params, "invite", invite);
  appendQuery(params, "host", host);
  appendQuery(params, "port", input.port);
  appendQuery(params, "nickname", input.nickname);
  appendQuery(params, "password", input.password);
  appendQuery(params, "channel", input.channel);
  appendQuery(params, "channelpassword", input.channelPassword || input.channelpassword);

  const query = params.toString();
  return `/teamspeak${query ? `?${query}` : ""}`;
}

