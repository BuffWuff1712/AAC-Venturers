// ─── CharacterStage ──────────────────────────────────────────────────────────
// Displays the AI character (student.png placeholder) in the centre of the
// screen with an optional animated speech bubble above them.

import React, { useEffect, useState } from "react";
import Image from "next/image";

interface CharacterStageProps {
  characterImage: string;   // e.g. "/images/student.png"
  characterName: string;    // e.g. "Friend"
  speech?: string;          // Text shown in the speech bubble (undefined = hidden)
  isListening?: boolean;    // Adds a subtle glow when the app is recording
}

const CharacterStage: React.FC<CharacterStageProps> = ({
  characterImage,
  characterName,
  speech,
  isListening = false,
}) => {
  // Animate the bubble in whenever `speech` changes
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (speech) {
      setVisible(false);
      // Brief delay lets the CSS transition fire cleanly
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [speech]);

  return (
    <div className="relative flex flex-col items-center justify-end h-full">
      {/* ── Speech bubble ──────────────────────────────────────────────────── */}
      {speech && (
        <div
          className={`
            absolute top-4 left-1/2 -translate-x-1/2
            max-w-xs w-max px-5 py-3
            bg-white rounded-2xl shadow-xl border-2 border-purple-200
            text-gray-800 text-lg font-bold text-center leading-snug
            transition-all duration-300
            ${visible ? "opacity-100 -translate-y-2 scale-100" : "opacity-0 translate-y-2 scale-95"}
          `}
          style={{ zIndex: 10 }}
        >
          {/* Speaker label above the bubble text */}
          <span className="block text-xs font-extrabold uppercase tracking-widest text-purple-500 mb-1">
            {characterName}
          </span>
          {speech}

          {/* Tail of the speech bubble pointing downward */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0
            border-l-[10px] border-l-transparent
            border-r-[10px] border-r-transparent
            border-t-[12px] border-t-white
          " />
        </div>
      )}

      {/* ── Character image ─────────────────────────────────────────────────── */}
      <div
        className={`
          relative transition-all duration-500
          ${isListening ? "drop-shadow-[0_0_24px_rgba(167,139,250,0.8)]" : "drop-shadow-xl"}
        `}
        style={{ width: 260, height: 380 }}
      >
        <Image
          src={characterImage}
          alt={characterName}
          fill
          className="object-contain object-bottom"
          priority
        />
      </div>

      {/* ── Name label under character ──────────────────────────────────────── */}
      <div className="mt-2 rounded-full bg-blue-500 px-8 py-2 text-lg font-black text-white shadow-lg">
        {characterName === "You" ? "You" : characterName}
      </div>
    </div>
  );
};

export default CharacterStage;
