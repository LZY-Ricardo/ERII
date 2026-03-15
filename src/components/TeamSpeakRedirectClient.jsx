"use client";

import { useEffect, useMemo } from "react";
import { buildTeamSpeakUri } from "@/src/lib/teamspeak";

function pickFirst(value) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default function TeamSpeakRedirectClient({ searchParams }) {
  const input = useMemo(() => {
    const params = searchParams || {};
    return {
      protocol: pickFirst(params.protocol),
      invite: pickFirst(params.invite),
      host: pickFirst(params.host),
      port: pickFirst(params.port),
      nickname: pickFirst(params.nickname),
      password: pickFirst(params.password),
      channel: pickFirst(params.channel),
      channelpassword: pickFirst(params.channelpassword),
    };
  }, [searchParams]);

  const uri = useMemo(() => buildTeamSpeakUri(input), [input]);

  useEffect(() => {
    if (!uri) return;
    // Must be triggered by a user-initiated navigation to have the best chance to work.
    window.location.replace(uri);
  }, [uri]);

  if (!uri) {
    return (
      <section className="nh-card nh-article-content" style={{ padding: 18 }}>
        <h2 style={{ margin: "0 0 10px", fontSize: 16 }}>TeamSpeak 拉起失败</h2>
        <p style={{ margin: 0, color: "rgba(47, 65, 89, 0.78)" }}>
          缺少参数。请使用类似 <code>/teamspeak?invite=XXXX</code> 或{" "}
          <code>/teamspeak?host=example.com&amp;port=9987</code> 的链接。
        </p>
      </section>
    );
  }

  return (
    <section className="nh-card nh-article-content" style={{ padding: 18 }}>
      <h2 style={{ margin: "0 0 10px", fontSize: 16 }}>正在打开 TeamSpeak...</h2>
      <p style={{ margin: "0 0 12px", color: "rgba(47, 65, 89, 0.78)" }}>
        如果没有自动弹出客户端，可能是浏览器拦截了自定义协议。你可以点击下面的备用链接再试一次。
      </p>
      <a href={uri} data-cta="button">
        继续打开 TeamSpeak
      </a>
      <p style={{ margin: "10px 0 0", color: "rgba(47, 65, 89, 0.62)", fontSize: 13 }}>
        目标链接：<code>{uri}</code>
      </p>
    </section>
  );
}
