"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PostEditLink({ slug }) {
  const [isAuthed, setIsAuthed] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const res = await fetch("/api/write/session", { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        setIsAuthed(Boolean(data?.authenticated));
      } catch {
        if (cancelled) return;
        setIsAuthed(false);
      } finally {
        if (cancelled) return;
        setIsChecked(true);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isChecked || !isAuthed || !slug) return null;

  return (
    <Link
      href={`/write?slug=${encodeURIComponent(slug)}`}
      className="inline-flex items-center gap-2 rounded-full border border-wafu-sumi/10 bg-white/60 px-4 py-2 text-xs text-wafu-sumi/75 transition-colors hover:bg-white/80 hover:text-erii-red"
    >
      编辑
    </Link>
  );
}

