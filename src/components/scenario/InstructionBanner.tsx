// ─── InstructionBanner ───────────────────────────────────────────────────────
// Renders the purple instruction banner at the top of every scenario screen.
// Shows "STEP X OF Y" and the current instruction text.

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
  // Calculate progress width for the thin progress bar inside the banner
  const progressPct = ((currentStep - 1) / totalSteps) * 100;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-purple-600 px-6 py-4 shadow-lg">
      {/* ── Thin progress bar along the bottom of the banner ── */}
      <div className="absolute bottom-0 left-0 h-1 w-full bg-purple-800/40">
        <div
          className="h-full bg-white/70 transition-all duration-700 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        {/* Left: step info + instruction */}
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-purple-200">
            Step {currentStep} of {totalSteps}
          </p>
          <p className="mt-0.5 text-2xl font-black text-white drop-shadow-sm">
            {instruction}
          </p>
        </div>

        {/* Right: optional countdown timer badge */}
        {timeRemaining !== undefined && (
          <div
            className={`flex items-center gap-2 rounded-full border-2 bg-white/10 px-4 py-2 text-white backdrop-blur-sm ${
              timeRemaining <= 10
                ? "animate-pulse border-red-300"
                : "border-white/30"
            }`}
          >
            {/* Clock icon (inline SVG – no extra package needed) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-lg font-black">{timeRemaining}s</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructionBanner;
