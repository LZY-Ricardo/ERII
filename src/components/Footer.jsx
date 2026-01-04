"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DuckIcon } from "./icons";

export default function Footer() {
  const pathname = usePathname();
  const router = useRouter();
  const clickCountRef = useRef(0);
  const resetTimerRef = useRef(null);
  const kwaTimerRef = useRef(null);
  const shojiOpenTimerRef = useRef(null);
  const shojiCleanupTimerRef = useRef(null);

  const [kwaVisible, setKwaVisible] = useState(false);
  const [shojiVisible, setShojiVisible] = useState(false);
  const [shojiOpen, setShojiOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      if (kwaTimerRef.current) clearTimeout(kwaTimerRef.current);
      if (shojiOpenTimerRef.current) clearTimeout(shojiOpenTimerRef.current);
      if (shojiCleanupTimerRef.current)
        clearTimeout(shojiCleanupTimerRef.current);
    };
  }, []);

  const hideFooter = pathname?.startsWith("/write");

  const handleSecretEntry = () => {
    if (shojiVisible) return;

    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    if (kwaTimerRef.current) clearTimeout(kwaTimerRef.current);

    clickCountRef.current += 1;

    setKwaVisible(true);
    kwaTimerRef.current = setTimeout(() => setKwaVisible(false), 520);

    if (clickCountRef.current >= 5) {
      clickCountRef.current = 0;
      if (shojiOpenTimerRef.current) clearTimeout(shojiOpenTimerRef.current);
      if (shojiCleanupTimerRef.current)
        clearTimeout(shojiCleanupTimerRef.current);

      setShojiVisible(true);
      setShojiOpen(false);
      router.push("/write");

      shojiOpenTimerRef.current = setTimeout(() => {
        setShojiOpen(true);
      }, 80);

      shojiCleanupTimerRef.current = setTimeout(() => {
        setShojiVisible(false);
        setShojiOpen(false);
      }, 740);

      return;
    }

    resetTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 1200);
  };

  return (
    <>
      {shojiVisible ? (
        <div
          className={`shoji-overlay ${shojiOpen ? "shoji-open" : ""}`}
          aria-hidden="true"
        >
          <div className="shoji-panel left" />
          <div className="shoji-panel right" />
        </div>
      ) : null}

      {hideFooter ? null : (
        <footer className="mx-auto max-w-5xl px-6 pb-12">
          <div className="mt-10 flex items-center justify-between border-t border-dashed border-wafu-sumi/15 pt-6 text-xs text-wafu-sumi/60">
            <span className="font-hand">
              © {new Date().getFullYear()} 絵梨衣の日記
            </span>
            <button
              type="button"
              onClick={handleSecretEntry}
              className="relative select-none rounded-full p-2 text-erii-duck/90 transition-transform hover:rotate-6 active:scale-95"
              aria-label="小黄鸭"
              title="..."
            >
              {kwaVisible ? (
                <span className="erii-pop pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-wafu-sumi/15 bg-wafu-paper/95 px-3 py-1 text-[10px] font-sans text-wafu-sumi shadow-sm">
                  Kwa!
                </span>
              ) : null}
              <DuckIcon className="h-6 w-6 drop-shadow-sm" />
            </button>
          </div>
        </footer>
      )}
    </>
  );
}
