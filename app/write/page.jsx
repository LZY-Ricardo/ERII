import { Suspense } from "react";
import WritePageV2 from "@/src/components/WritePageV2";

export default function WritePageRoute() {
  return (
    <Suspense fallback={null}>
      <WritePageV2 />
    </Suspense>
  );
}
