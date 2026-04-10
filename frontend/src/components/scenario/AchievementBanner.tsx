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
      className="achievement-banner fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100]
        flex flex-col items-center gap-2 bg-white rounded-[40px] shadow-2xl border-8 border-child-green
        px-10 py-8 min-w-[400px] text-center"
      style={{
        animation: `achievementSlideIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards,
                    achievementFadeOut 0.5s ease-in ${durationMs - 500}ms forwards`,
      }}
    >
      <div className="text-7xl mb-2 animate-bounce">🏆</div>

      <div>
        <p className="text-sm font-black uppercase tracking-[0.2em] text-caregiver-peach">
          Achievement Unlocked!
        </p>
        <p className="text-4xl font-black text-text-brown mt-1">
          {achievementName}
        </p>
      </div>

      {/* Star icon */}
      <div className="flex gap-4 mt-4">
        <span className="text-4xl animate-pulse">⭐</span>
        <span className="text-4xl animate-pulse delay-75">⭐</span>
        <span className="text-4xl animate-pulse delay-150">⭐</span>
      </div>


      {/* Keyframe styles injected inline – avoids needing a separate CSS file */}
      <style>{`
        @keyframes achievementPopIn {
          from { 
            opacity: 0; 
            transform: translate(-50%, -40%) scale(0.5); 
          }
          to { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1); 
          }
        }
        @keyframes achievementFadeOut {
          from { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1); 
          }
          to { 
            opacity: 0; 
            transform: translate(-50%, -60%) scale(0.9); 
            pointer-events: none; 
          }
        }
      `}</style>
    </div >
  );
};

export default AchievementBanner;