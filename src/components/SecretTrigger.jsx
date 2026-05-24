"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import { Gamepad2 } from "lucide-react";
import Image from "next/image";

export default function SecretTrigger() {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState("");
  const [gifLoaded, setGifLoaded] = useState(true);

  const triggerGifSrc = "/images/secret-trigger.webp";

  const triggerSakura = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#ffb7b2", "#ff9aa2"],
        shapes: ["circle"],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#ffb7b2", "#ff9aa2"],
        shapes: ["circle"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  const checkCode = (event) => {
    event.preventDefault();
    if (code.toLowerCase() === "sakura") {
      triggerSakura();
      setIsOpen(false);
      alert("Sakura 最好了！🌸");
    } else {
      alert("指令错误...小怪兽听不懂。");
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {isOpen ? (
        <form
          onSubmit={checkCode}
          className="erii-pop rounded-xl border-2 border-erii-duck bg-white p-4 shadow-xl"
        >
          <p className="mb-2 text-lg font-hand text-erii-red">谁最好？</p>
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="w-full border-b-2 border-slate-200 text-center font-hand outline-none focus:border-erii-red"
            placeholder="..."
            autoFocus
          />
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative grid h-14 w-14 place-items-center overflow-hidden rounded-full border border-wafu-sumi/10 bg-wafu-paper/95 shadow-lg backdrop-blur-sm transition-transform hover:scale-110 active:scale-95"
          aria-label="打开彩蛋"
        >
          {gifLoaded ? (
            <Image
              src={triggerGifSrc}
              alt=""
              fill
              sizes="56px"
              unoptimized
              className="select-none object-cover"
              draggable={false}
              onError={() => setGifLoaded(false)}
            />
          ) : (
            <Gamepad2 size={24} className="relative z-10 text-erii-red" />
          )}
        </button>
      )}
    </div>
  );
}
