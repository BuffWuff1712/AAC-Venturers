// ─── AchievementBanner ───────────────────────────────────────────────────────
// Small notification banner that:
//  • Appears automatically when `show` becomes true
//  • Cannot be closed by the user
//  • Fades away after `durationMs` (default 4 000 ms)
//  • Triggers a confetti burst (using canvas-confetti) while visible

import React, { useEffect, useRef } from "react";
import confetti from "canvas-confetti"; // npm install canvas-confetti

interface AchievementBannerProps {
  show: boolean;
  achievementName: string;
  durationMs?: number;
  onDone?: () => void; // Called after the banner has faded out
}

const AchievementBanner: React.FC<AchievementBannerProps> = ({
  show,
  achievementName,
  durationMs = 4_000,
  onDone,
}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!show) return;

    // 🎉 Burst confetti from both sides
    const fireConfetti = () => {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { x: 0.2, y: 0.2 },
        colors: ["#a855f7", "#22c55e", "#facc15", "#3b82f6"],
      });
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { x: 0.8, y: 0.2 },
        colors: ["#a855f7", "#22c55e", "#facc15", "#3b82f6"],
      });
    };

    fireConfetti();
    // Second burst for extra flair
    timerRef.current = setTimeout(fireConfetti, 600);

    // Schedule the fade-out callback
    const doneTimer = setTimeout(() => {
      onDone?.();
    }, durationMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      clearTimeout(doneTimer);
    };
  }, [show, durationMs, onDone]);

  if (!show) return null;

  return (
    <div
      // The banner slides down then fades – keyframes defined in global CSS
      className="achievement-banner fixed top-4 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-4 bg-white rounded-2xl shadow-2xl border-4 border-purple-400
        px-6 py-3 min-w-[320px]"
      style={{
        animation: `achievementSlideIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards,
                    achievementFadeOut 0.5s ease-in ${durationMs - 500}ms forwards`,
      }}
    >
      {/* Trophy icon */}
      <span className="text-4xl">🏆</span>

      <div>
        <p className="text-xs font-extrabold uppercase tracking-widest text-purple-500">
          Achievement Unlocked!
        </p>
        <p className="text-xl font-black text-gray-800">{achievementName}</p>
      </div>

      {/* Star icon */}
      <span className="text-3xl ml-auto">⭐</span>

      {/* Keyframe styles injected inline – avoids needing a separate CSS file */}
      <style>{`
        @keyframes achievementSlideIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes achievementFadeOut {
          from { opacity: 1; }
          to   { opacity: 0; pointer-events: none; }
        }
      `}</style>
    </div>
  );
};

export default AchievementBanner;
