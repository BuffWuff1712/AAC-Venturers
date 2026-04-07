// ─── InstructionBanner ───────────────────────────────────────────────────────
// Renders the instruction banner at the top of every scenario screen.

import React from "react";

interface InstructionBannerProps {
  currentStep: number;
  totalSteps: number;
  instruction: string;
  timeRemaining?: number; // seconds; shown as a countdown badge
}

const InstructionBanner: React.FC<InstructionBannerProps> = ({
  currentStep,
  totalSteps,
  instruction,
  timeRemaining,
}) => {
  const progressPct = ((currentStep - 1) / totalSteps) * 100;

  return (
    // Changed background to bg-caregiver-peach, updated z-index to stay on top
    <div className="relative w-full overflow-hidden rounded-2xl bg-caregiver-peach px-6 py-4 shadow-lg z-20">

      {/* ── Thin progress bar along the bottom of the banner ──
          Updated color to child-green for better visibility against peach */}
      <div className="absolute bottom-0 left-0 h-1.5 w-full bg-child-green/60">
        <div
          className="h-full bg-child-green transition-all duration-700 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        {/* Left: step info + instruction */}
        <div>
          {/* Color changed to text-text-brown with opacity */}
          <p className="text-xs font-bold uppercase tracking-widest text-text-brown opacity-60">
            Step {currentStep} of {totalSteps}
          </p>
          {/* Color changed to text-text-brown, font weight increased to font-black */}
          <p className="mt-0.5 text-2xl font-black text-text-brown drop-shadow-sm">
            {instruction}
          </p>
        </div>

        {/* Right: optional countdown timer badge
            Colors updated to use white/brown accents with red for warning */}
        {timeRemaining !== undefined && (
          <div
            className={`flex items-center gap-2 rounded-full border-2 px-4 py-2 text-lg font-black backdrop-blur-sm ${timeRemaining <= 10
                ? "animate-pulse border-red-500 bg-red-50 text-red-600"
                : "border-white/50 bg-white/20 text-text-brown"
              }`}
          >
            {/* Clock icon, color set by parent text color */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{timeRemaining}s</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructionBanner;