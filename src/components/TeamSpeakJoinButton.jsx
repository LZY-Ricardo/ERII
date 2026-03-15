import { buildTeamSpeakRedirectHref, buildTeamSpeakUri } from "@/src/lib/teamspeak";

export default function TeamSpeakJoinButton({
  label = "进入服务器",
  mode = "redirect",
  protocol = "teamspeak",
  invite = "",
  host = "",
  port,
  channel,
  channelPassword,
  password,
  nickname,
  href,
  ...props
}) {
  const resolvedHref =
    href ||
    (mode === "direct"
      ? buildTeamSpeakUri({
          protocol,
          invite,
          host,
          port,
          channel,
          channelPassword,
          password,
          nickname,
        })
      : buildTeamSpeakRedirectHref({
          protocol,
          invite,
          host,
          port,
          channel,
          channelPassword,
          password,
          nickname,
        }));

  return (
    <a {...props} href={resolvedHref} data-cta="button">
      {label}
    </a>
  );
}
