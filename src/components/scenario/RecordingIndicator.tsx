// ─── RecordingIndicator ──────────────────────────────────────────────────────
// Shows the red "Recording…" indicator and exposes a Stop button.
// Uses the Web Speech API (SpeechRecognition) to transcribe speech in-browser.
// Recording starts AUTOMATICALLY – no button press needed.

import React, { useEffect, useRef, useCallback } from "react";

interface RecordingIndicatorProps {
  isRecording: boolean;
  onTranscript: (text: string) => void; // Called with the final recognised text
  onStop: () => void;                   // Called when Stop is clicked
  onNoSpeech?: () => void;             // Called after 30 s silence (stuck helper)
  silenceTimeoutMs?: number;           // Default 30 000 ms
}

// TypeScript doesn't ship SpeechRecognition types out of the box
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

const RecordingIndicator: React.FC<RecordingIndicatorProps> = ({
  isRecording,
  onTranscript,
  onStop,
  onNoSpeech,
  silenceTimeoutMs = 30_000,
}) => {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset the 30-second silence timer whenever speech is detected
  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      onNoSpeech?.();
    }, silenceTimeoutMs);
  }, [onNoSpeech, silenceTimeoutMs]);

  useEffect(() => {
    if (!isRecording) {
      // Tear down recognition when the parent says we're done
      recognitionRef.current?.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      return;
    }

    // Browser compatibility shim
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      console.warn("SpeechRecognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;       // Keep listening between utterances
    recognition.interimResults = false;  // Only fire for final results
    recognition.lang = "en-SG";         // Singapore English

    // When a final result comes in, forward it to the parent
    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      if (last.isFinal) {
        const text = last[0].transcript.trim();
        if (text) {
          onTranscript(text);
          resetSilenceTimer(); // Speech detected – reset the stuck timer
        }
      }
    };

    recognition.onerror = (e) => {
      if (e.error !== "no-speech") console.error("SpeechRecognition error:", e.error);
    };

    // Restart recognition if it stops on its own (browser time-limit quirk)
    recognition.onend = () => {
      if (isRecording) recognition.start();
    };

    recognitionRef.current = recognition;
    recognition.start();
    resetSilenceTimer(); // Start the initial 30-second silence window

    return () => {
      recognition.onend = null; // Prevent restart on cleanup
      recognition.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [isRecording, onTranscript, resetSilenceTimer]);

  if (!isRecording) return null;

  return (
    <div className="flex items-center gap-3">
      {/* Pulsing red recording badge */}
      <div className="flex items-center gap-2 rounded-full bg-red-500 px-5 py-2.5 shadow-lg">
        <span className="relative flex h-3 w-3">
          {/* Ping animation around the red dot */}
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-200 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
        </span>
        <span className="text-white font-black text-base tracking-wide">
          Recording…
        </span>
        <span className="text-red-200 text-sm font-semibold">Listening</span>
      </div>

      {/* Stop button */}
      <button
        onClick={onStop}
        className="flex items-center gap-2 rounded-full bg-gray-800 px-5 py-2.5 text-white font-black text-base shadow-lg hover:bg-gray-700 active:scale-95 transition-all"
      >
        <span className="w-3 h-3 bg-white rounded-sm inline-block" />
        Stop
      </button>
    </div>
  );
};

export default RecordingIndicator;
