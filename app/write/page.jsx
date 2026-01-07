import { Suspense } from "react";
import WritePage from "@/src/components/WritePage";

export default function WritePageRoute() {
  return (
    <Suspense fallback={null}>
      <WritePage />
    </Suspense>
  );
}
