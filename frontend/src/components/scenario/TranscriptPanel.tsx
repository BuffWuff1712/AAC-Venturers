// ─── TranscriptPanel ─────────────────────────────────────────────────────────
// Scrollable log showing the full conversation.

import React, { useEffect, useRef } from "react";
import { TranscriptEntry } from "../../types/scenario";

interface TranscriptPanelProps {
  entries: TranscriptEntry[];
}

// Map speaker key → color accent, updated to match theme
const SPEAKER_COLORS: Record<string, string> = {
  friend: "text-caregiver-peach", // Caregiver Orange/Peach
  child: "text-child-green",    // Child Green
  auntie: "text-red-500",        // Keep as warning/different color
  teacher: "text-text-brown",     // Brown/Main text color
};

const TranscriptPanel: React.FC<TranscriptPanelProps> = ({ entries }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  return (
    // Background updated to use a more solid white/90 for better text visibility
    <div className="w-full rounded-2xl bg-white/90 backdrop-blur-sm border-2 border-caregiver-peach shadow-lg">

      {/* Header row
          Color updated to text-text-brown with opacity */}
      <div className="px-5 pt-3 pb-1 border-b border-gray-100">
        <p className="text-xs font-extrabold uppercase tracking-widest text-text-brown opacity-60">
          Conversation Log
        </p>
      </div>

      {/* Scrollable entry list
          Max height set to max-h-40 to keep it manageable */}
      <div className="overflow-y-auto max-h-40 px-5 py-4 space-y-2">
        {entries.length === 0 && (
          // Color updated to text-text-brown with opacity
          <p className="text-sm text-text-brown opacity-50 italic">
            The conversation will appear here…
          </p>
        )}

        {entries.map((entry, idx) => (
          <div
            key={idx}
            className="flex items-baseline gap-2 text-base leading-tight"
          >
            {/* Bold colored speaker label
                Default color set to text-text-brown */}
            <span
              className={`font-black shrink-0 ${SPEAKER_COLORS[entry.speaker] ?? "text-text-brown"
                }`}
            >
              {entry.label}:
            </span>
            {/* Transcript text
                Color set to text-text-brown */}
            <span className="text-text-brown font-medium">{entry.text}</span>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default TranscriptPanel;