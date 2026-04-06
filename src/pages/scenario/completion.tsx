import React from "react";
import { useRouter } from "next/router";
import Image from "next/image";

const CompletionPage: React.FC = () => {
  const router = useRouter();

  const resultParam = Array.isArray(router.query.result)
    ? router.query.result[0]
    : router.query.result;

  return (
    <div className="min-h-screen bg-page-peach font-fredoka flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl flex flex-col items-center gap-8">
        <Image
          src="/images/mascot.png"
          alt="AAC mascot"
          width={280}
          height={280}
          className="w-48 h-48 md:w-64 md:h-64 object-contain"
          priority
        />

        <div className="relative w-full bg-white rounded-3xl p-6 md:p-8 shadow-xl text-center">
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-4 w-8 h-8 bg-white rotate-45" />
          <p className="relative z-10 text-2xl md:text-3xl font-black text-text-brown leading-snug">
            good job on your AACventure! now pass your device back to caregiver
          </p>
        </div>

        <button
          onClick={() =>
            router.push({
              pathname: "/scenario/caregiver-evaluation",
              query: resultParam ? { result: resultParam } : undefined,
            })
          }
          className="bg-child-green text-text-brown font-black text-xl px-8 py-4 rounded-2xl shadow-[0_6px_0_rgb(163,213,106)] active:shadow-none active:translate-y-1 transition-all"
        >
          {"continue --> caregiver evaluation"}
        </button>
      </div>
    </div>
  );
};

export default CompletionPage;
