import React, { useEffect, useState } from "react";
import Image from "next/image";

interface CharacterStageProps {
  characterImage?: string;
  characterName: string;
  speech?: string;
  isListening?: boolean;
  isLoading?: boolean;
}

const CharacterStage: React.FC<CharacterStageProps> = ({
  characterImage,
  characterName,
  speech,
  isListening = false,
  isLoading = false,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (speech) {
      setVisible(false);
      const timer = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(timer);
    }

    setVisible(false);
  }, [speech]);

  return (
    <div className="relative flex h-full w-full items-end justify-center overflow-visible px-4 pb-2 md:px-8">
      <div className="flex w-full max-w-5xl flex-col items-center justify-center gap-4 md:flex-row md:items-end md:justify-center md:gap-8">
        {speech && (
          <div
            className={`relative order-1 z-30 w-full max-w-xl rounded-[32px] border-4 border-caregiver-peach bg-white px-6 py-4 shadow-2xl transition-all duration-300 transform md:order-2 md:-ml-20 md:mt-6 md:w-[380px] md:self-start ${
              visible
                ? "translate-y-0 opacity-100 scale-100"
                : "translate-y-4 opacity-0 scale-90"
            }`}
          >
            <p className="text-center text-lg font-black leading-tight text-text-brown md:text-xl">
              {speech}
            </p>
            <div className="absolute -bottom-4 left-1/2 h-0 w-0 -translate-x-1/2 border-l-[12px] border-r-[12px] border-t-[16px] border-l-transparent border-r-transparent border-t-caregiver-peach md:-left-4 md:bottom-4 md:translate-x-0 md:border-l-0 md:border-r-[16px] md:border-t-[12px] md:border-b-[12px] md:border-r-caregiver-peach md:border-t-transparent md:border-b-transparent" />
          </div>
        )}

        <div className="order-2 flex flex-col items-center md:order-1">
          <div
            className={`relative transition-all duration-500 drop-shadow-2xl ${
              isListening ? "scale-[1.02]" : "scale-100"
            }`}
            style={{ width: 300, height: 300 }}
          >
            {isLoading || !characterImage ? (
              <div className="flex h-full w-full items-center justify-center rounded-full border-8 border-white/80 bg-white/75 shadow-inner">
                <div className="h-24 w-24 animate-spin rounded-full border-8 border-caregiver-peach border-t-transparent" />
              </div>
            ) : (
              <Image
                src={characterImage}
                alt={characterName}
                fill
                className="object-contain object-bottom"
                priority
              />
            )}
          </div>

          <div className="mt-4 rounded-full border-2 border-white bg-caregiver-peach px-10 py-1 text-xl font-black text-text-brown shadow-lg">
            {characterName}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterStage;
