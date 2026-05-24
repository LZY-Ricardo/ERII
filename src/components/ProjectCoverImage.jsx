"use client";

import { useState } from "react";
import Image from "next/image";

export default function ProjectCoverImage({ src, alt }) {
  const [coverFailed, setCoverFailed] = useState(false);
  const hasCover = Boolean(src) && !coverFailed;

  if (!hasCover) {
    return <span className="nh-project-cover nh-project-cover-fallback" aria-hidden="true" />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={960}
      height={540}
      className="nh-project-cover"
      onError={() => setCoverFailed(true)}
    />
  );
}
