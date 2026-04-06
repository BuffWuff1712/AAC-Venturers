// ─── TranscriptPanel ─────────────────────────────────────────────────────────
// Scrollable log at the bottom of the screen showing the full conversation.
// Each entry clearly labels the speaker and auto-scrolls to the latest line.

import React, { useEffect, useRef } from "react";
import { TranscriptEntry } from "../../types/scenario";

interface TranscriptPanelProps {
  entries: TranscriptEntry[];
}

// Map speaker key → colour accent so each speaker is visually distinct
const SPEAKER_COLORS: Record<string, string> = {
  friend:  "text-purple-600",
  child:   "text-blue-600",
  auntie:  "text-orange-600",
  teacher: "text-green-600",
};

const TranscriptPanel: React.FC<TranscriptPanelProps> = ({ entries }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to newest entry whenever transcript updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  return (
    <div className="w-full rounded-2xl bg-white/90 backdrop-blur-sm border border-gray-100 shadow-inner">
      {/* Header row */}
      <div className="px-5 pt-3 pb-1 border-b border-gray-100">
        <p className="text-xs font-extrabold uppercase tracking-widest text-gray-400">
          Conversation Log
        </p>
      </div>

      {/* Scrollable entry list – max height keeps it compact */}
      <div className="overflow-y-auto max-h-28 px-5 py-3 space-y-1">
        {entries.length === 0 && (
          <p className="text-sm text-gray-400 italic">
            The conversation will appear here…
          </p>
        )}

        {entries.map((entry, idx) => (
          <div
            key={idx}
            className="flex items-baseline gap-2 text-base leading-snug"
          >
            {/* Bold coloured speaker label */}
            <span
              className={`font-extrabold shrink-0 ${
                SPEAKER_COLORS[entry.speaker] ?? "text-gray-700"
              }`}
            >
              {entry.label}:
            </span>
            {/* Transcript text */}
            <span className="text-gray-700 font-medium">{entry.text}</span>
          </div>
        ))}

        {/* Invisible anchor for auto-scroll */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default TranscriptPanel;
