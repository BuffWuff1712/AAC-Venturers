// ─── CharacterStage ──────────────────────────────────────────────────────────

import React, { useEffect, useState } from "react";
import Image from "next/image";

interface CharacterStageProps {
  characterImage: string;
  characterName: string;
  speech?: string;
  isListening?: boolean;
}

const CharacterStage: React.FC<CharacterStageProps> = ({
  characterImage,
  characterName,
  speech,
  isListening = false,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (speech) {
      setVisible(false);
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [speech]);

  return (
    <div className="relative w-full h-full">

      {/* ── THE UNIFIED UNIT ──────────────────────────────────────────────
          FIX: We use 'bottom-[60px]' to lift the character up. 
          This creates a 'permanent' space for the recording bar below them
          so the mascot doesn't jump when the bar appears/disappears.
          LOL this lowkey doesnt work but i guess it does help a bit with the positioning */}
      <div className="absolute bottom-[0px] left-1/2 -translate-x-1/2 flex flex-col items-center">

        {/* ── 1. SPEECH BUBBLE ─────────────── */}
        {speech && (
          <div
            className={`
              absolute bottom-[360px] z-30
              max-w-lg min-w-[200px] w-max px-8 py-4
              bg-white rounded-[32px] shadow-2xl border-4 border-caregiver-peach
              transition-all duration-300 transform
              ${visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-4"}
            `}
          >
            <p className="text-text-brown text-xl font-black text-center leading-tight">
              {speech}
            </p>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0 h-0
              border-l-[12px] border-l-transparent
              border-r-[12px] border-r-transparent
              border-t-[16px] border-t-caregiver-peach
            " />
          </div>
        )}

        {/* ── 2. MASCOT IMAGE ─────────────────────────────────────────── */}
        <div
          className={`relative transition-all duration-500 drop-shadow-2xl right-[8%]`}
          style={{ width: 300, height: 300 }}
        >
          <Image
            src={characterImage}
            alt={characterName}
            fill
            className="object-contain object-bottom"
            priority
          />
        </div>

        {/* ── 3. NAME LABEL ─────────────────────────────────────────────── */}
        <div className="mt-4 rounded-full bg-caregiver-peach px-10 py-1 text-xl font-black text-text-brown shadow-lg border-2 border-white">
          {characterName}
        </div>

      </div>
    </div>
  );
};
export default CharacterStage;