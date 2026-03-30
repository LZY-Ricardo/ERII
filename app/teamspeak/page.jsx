import ArgonShell from "@/src/components/argon/ArgonShell";
import TeamSpeakRedirectClient from "@/src/components/TeamSpeakRedirectClient";
import { getSortedPostsData } from "@/src/lib/posts";

export const metadata = {
  title: "打开 TeamSpeak | 象龟的水坑",
  description: "尝试拉起本地 TeamSpeak 客户端并加入指定服务器/频道。",
  robots: { index: false, follow: false },
};

export default async function TeamSpeakRedirectPage({ searchParams }) {
  const posts = await getSortedPostsData();
  const resolvedSearchParams = await searchParams;

  return (
    <ArgonShell posts={posts} title="TeamSpeak" subtitle="正在尝试拉起本地客户端...">
      <TeamSpeakRedirectClient searchParams={resolvedSearchParams} />
    </ArgonShell>
  );
}
