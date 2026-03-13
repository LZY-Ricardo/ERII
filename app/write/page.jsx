import { Suspense } from "react";
import WritePageV2 from "@/src/components/WritePageV2";

export default async function WritePageRoute({ searchParams }) {
  const resolved = (await searchParams) ?? {};
  const slugKey =
    typeof resolved.slug === "string" && resolved.slug.trim()
      ? resolved.slug.trim()
      : "new";

  return (
    <Suspense fallback={null}>
      <WritePageV2 key={slugKey} />
    </Suspense>
  );
}
