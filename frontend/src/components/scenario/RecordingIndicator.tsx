import React, { useEffect, useRef, useCallback } from "react";

interface RecordingIndicatorProps {
  isRecording: boolean;
  onTranscript: (text: string) => void;
  onStop: () => void;
  onNoSpeech?: () => void;
  silenceTimeoutMs?: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResult {
  0: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface BrowserSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructor {
  new (): BrowserSpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const RecordingIndicator: React.FC<RecordingIndicatorProps> = ({
  isRecording,
  onTranscript,
  onStop,
  onNoSpeech,
  silenceTimeoutMs = 30_000,
}) => {
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const resetSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      onNoSpeech?.();
    }, silenceTimeoutMs);
  }, [clearSilenceTimer, onNoSpeech, silenceTimeoutMs]);

  useEffect(() => {
    if (!isRecording) {
      recognitionRef.current?.stop();
      clearSilenceTimer();
      return;
    }

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      console.warn("SpeechRecognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-SG";

    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      if (!last.isFinal) {
        return;
      }

      const text = last[0].transcript.trim();
      if (!text) {
        return;
      }

      clearSilenceTimer();
      onTranscript(text);
    };

    recognition.onerror = (event) => {
      if (event.error !== "no-speech") {
        console.error("SpeechRecognition error:", event.error);
      }
    };

    recognition.onend = () => {
      if (isRecording) {
        recognition.start();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    resetSilenceTimer();

    return () => {
      recognition.onend = null;
      recognition.stop();
      clearSilenceTimer();
    };
  }, [clearSilenceTimer, isRecording, onTranscript, resetSilenceTimer]);

  if (!isRecording) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 rounded-full bg-red-500 px-5 py-2.5 shadow-lg">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-200 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
        </span>
        <span className="text-base font-black tracking-wide text-white">
          Recording...
        </span>
        <span className="text-sm font-semibold text-red-200">Listening</span>
      </div>

      <button
        onClick={onStop}
        className="flex items-center gap-2 rounded-full bg-gray-800 px-5 py-2.5 text-base font-black text-white shadow-lg transition-all hover:bg-gray-700 active:scale-95"
      >
        <span className="inline-block h-3 w-3 rounded-sm bg-white" />
        Stop
      </button>
    </div>
  );
};

export default RecordingIndicator;
