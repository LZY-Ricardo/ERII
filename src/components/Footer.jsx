"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

function DuckIcon({ className }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M38 14c0 5-4 9-9 9s-9-4-9-9 4-9 9-9 9 4 9 9Z"
        fill="currentColor"
      />
      <path
        d="M52 40c0 10-9 18-20 18S12 50 12 40c0-8 6-15 14-17 3 3 7 5 12 5 6 0 11-2 14-5v-1c0 10 0 10 0 18Z"
        fill="currentColor"
        opacity="0.95"
      />
      <path
        d="M39 19c4 0 7 2 9 5-2 2-5 4-9 4-3 0-6-1-8-3 2-4 5-6 8-6Z"
        fill="currentColor"
        opacity="0.55"
      />
    </svg>
  );
}

export default function Footer() {
  const pathname = usePathname();
  const router = useRouter();
  const clickCountRef = useRef(0);
  const resetTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  if (pathname?.startsWith("/write")) return null;

  const handleSecretEntry = () => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);

    clickCountRef.current += 1;
    if (clickCountRef.current >= 5) {
      clickCountRef.current = 0;
      router.push("/write");
      return;
    }

    resetTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 1200);
  };

  return (
    <footer className="mx-auto max-w-5xl px-6 pb-12">
      <div className="mt-10 flex items-center justify-between border-t border-dashed border-erii-red/25 pt-6 text-xs text-erii-ink/60">
        <span className="font-hand">© {new Date().getFullYear()} 絵梨衣の日記</span>
        <button
          type="button"
          onClick={handleSecretEntry}
          className="select-none rounded-full p-2 text-erii-duck/90 transition-transform hover:rotate-6 active:scale-95"
          aria-label="小黄鸭"
          title="..."
        >
          <DuckIcon className="h-6 w-6 drop-shadow-sm" />
        </button>
      </div>
    </footer>
  );
}
