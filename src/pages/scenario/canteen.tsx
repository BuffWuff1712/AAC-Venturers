// ─── pages/scenario/canteen.tsx ──────────────────────────────────────────────
// The main "Talking to a Friend" canteen scenario.
// Orchestrates step flow, auto-recording, transcript accumulation, and
// session analytics, then passes results to the completion page.

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import Image from "next/image";

// ── Sub-components
import InstructionBanner from "@/components/scenario/InstructionBanner";
import CharacterStage from "@/components/scenario/CharacterStage";
import TranscriptPanel from "@/components/scenario/TranscriptPanel";
import RecordingIndicator from "@/components/scenario/RecordingIndicator";
import AchievementBanner from "@/components/scenario/AchievementBanner";

// ── Types
import {
  ScenarioStep,
  TranscriptEntry,
  PromptAnalytic,
  SessionResult,
} from "../../types/scenario";

// ─────────────────────────────────────────────────────────────────────────────
// Scenario definition: 4 steps matching the spec
// ─────────────────────────────────────────────────────────────────────────────
const STEPS: ScenarioStep[] = [
  {
    id: 1,
    instruction: "Say hello to your friend.",
    characterSpeech: "Hi!",
    waitForChild: true,
  },
  {
    id: 2,
    instruction: "Great! Now ask your friend how they are.",
    characterSpeech: undefined, // Friend waits after child said hi
    waitForChild: true,
  },
  {
    id: 3,
    instruction: "Listen to your friend's answer.",
    characterSpeech: "I'm good! How about you?",
    waitForChild: false,
    autoAdvanceAfterMs: 3_000,
  },
  {
    id: 4,
    instruction: "Tell your friend how you are!",
    characterSpeech: undefined,
    waitForChild: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const CanteenScenario: React.FC = () => {
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────────────
  const [stepIndex, setStepIndex] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [analytics, setAnalytics] = useState<PromptAnalytic[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(30);
  // const [showStuckHelper, setShowStuckHelper] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  const [scenarioDone, setScenarioDone] = useState(false);

  // Track when the current child-prompt started (for response-time analytics)
  const promptStartRef = useRef<number>(Date.now());
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentStep = STEPS[stepIndex];
  const totalSteps = STEPS.length;

  // ── Helpers ────────────────────────────────────────────────────────────────

  // Add a line to the transcript log
  const addEntry = useCallback(
    (speaker: TranscriptEntry["speaker"], label: string, text: string) => {
      setTranscript((prev) => [
        ...prev,
        { speaker, label, text, timestamp: Date.now() },
      ]);
    },
    []
  );

  // Start the 30-second countdown display
  const startCountdown = useCallback(() => {
    setCountdown(30);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(countdownIntervalRef.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1_000);
  }, []);

  const stopCountdown = useCallback(() => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  }, []);

  // ── Step transitions ───────────────────────────────────────────────────────

  const advanceStep = useCallback(() => {
    stopCountdown();
    // setShowStuckHelper(false);
    setIsRecording(false);

    if (stepIndex + 1 >= totalSteps) {
      // Scenario complete
      setScenarioDone(true);
      // Check achievement: total response time < 10 s across all child steps
      const totalMs = analytics.reduce((a, b) => a + b.responseTimeMs, 0);
      if (totalMs < 10_000) setShowAchievement(true);
      return;
    }

    setStepIndex((i) => i + 1);
  }, [stepIndex, totalSteps, analytics, stopCountdown]);

  // ── Handle child's speech transcript ─────────────────────────────────────

  const handleTranscript = useCallback(
    (text: string) => {
      stopCountdown();
      // setShowStuckHelper(false);

      const responseMs = Date.now() - promptStartRef.current;

      // Map step id → readable analytics label
      const LABELS: Record<number, string> = {
        1: "Greeting response",
        2: "Question response",
        4: "Final response",
      };

      setAnalytics((prev) => [
        ...prev,
        {
          stepId: currentStep.id,
          label: LABELS[currentStep.id] ?? `Step ${currentStep.id} response`,
          responseTimeMs: responseMs,
          // hintsUsed: showStuckHelper ? 1 : 0,
          hintsUsed: 0, // For simplicity, not tracking hints in this version
        },
      ]);

      addEntry("child", "You", text);

      // Advance to the next scripted turn.
      setTimeout(advanceStep, 600);
    },
    [currentStep, addEntry, advanceStep, stopCountdown]
  );

  // ── Stuck helper: activated after 30 s silence ─────────────────────────────

  // const handleNoSpeech = useCallback(() => {
  //   setShowStuckHelper(true);
  // }, []);

  // ── Step entry effect: fires every time stepIndex changes ─────────────────

  useEffect(() => {
    const step = STEPS[stepIndex];
    promptStartRef.current = Date.now();

    // If the character speaks, add to transcript
    if (step.characterSpeech) {
      addEntry("friend", "Friend", step.characterSpeech);
    }

    if (step.waitForChild) {
      // Start recording and countdown for child-response steps
      setIsRecording(true);
      startCountdown();
    } else {
      setIsRecording(false);
      stopCountdown();
    }

    // Auto-advance steps that don't need child input
    if (!step.waitForChild && step.autoAdvanceAfterMs) {
      const t = setTimeout(advanceStep, step.autoAdvanceAfterMs);
      return () => clearTimeout(t);
    }
  }, [stepIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navigate to completion page once scenario ends ────────────────────────

  useEffect(() => {
    if (!scenarioDone) return;
    // Wait for achievement banner to play, then navigate
    const delay = showAchievement ? 4_500 : 1_000;
    const t = setTimeout(() => {
      const result: SessionResult = {
        scenarioId: "canteen",
        scenarioTitle: "Talking to a Friend – Canteen",
        transcript,
        analytics,
        totalSteps,
        completedSteps: totalSteps,
        totalResponseTimeMs: analytics.reduce((a, b) => a + b.responseTimeMs, 0),
      };
      // Pass result as query param (JSON-encoded); real apps would use state management
      router.push({
        pathname: "/scenario/completion",
        query: { result: JSON.stringify(result) },
      });
    }, delay);
    return () => clearTimeout(t);
  }, [scenarioDone]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-screen h-screen overflow-hidden font-fredoka">

      {/* ── Background image (squashed to fill, slightly transparent) ──────── */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/canteen_bg.png "
          alt="School canteen"
          fill
          className="object-fill opacity-60"  // opacity-60 = slightly transparent
          priority
        />
        {/* Extra overlay so characters and labels pop */}
        <div className="absolute inset-0 bg-white/20" />
      </div>

      {/* ── Achievement banner (fixed, auto-fades) ───────────────────────────── */}
      <AchievementBanner
        show={showAchievement}
        achievementName="Quick Responder"
        durationMs={4_000}
      />

      {/* ── Main layout: column filling the viewport ─────────────────────────── */}
      <div className="relative z-10 flex flex-col h-full p-4 gap-3">

        {/* TOP: instruction banner */}
        <InstructionBanner
          currentStep={stepIndex + 1}
          totalSteps={totalSteps}
          instruction={currentStep.instruction}
          timeRemaining={currentStep.waitForChild ? countdown : undefined}
        />

        {/* MIDDLE: character stage – takes all remaining space */}
        <div className="flex-1 flex items-center justify-center">
          <CharacterStage
            characterImage="/images/student.png"   // placeholder
            characterName="Friend"
            speech={currentStep.characterSpeech}
            isListening={isRecording}
          />
        </div>

        {/* STUCK HELPER: gentle prompt that floats above the transcript */}
        {/* {showStuckHelper && (
          <div className="mx-auto bg-yellow-400 rounded-2xl px-6 py-3 text-text-brown font-black text-lg shadow-lg animate-bounce">
            💡 Try saying: "
            {stepIndex === 0 ? "Hi!" : stepIndex === 1 ? "How are you?" : "I'm good!"}
            "
          </div>
        )} */}

        {/* BOTTOM: recording indicator + transcript */}
        <div className="flex flex-col gap-2">
          {/* Recording controls row */}
          <div className="flex justify-center">
            <RecordingIndicator
              isRecording={isRecording}
              onTranscript={handleTranscript}
              onStop={() => {
                setIsRecording(false);
                stopCountdown();
              }}
              // onNoSpeech={handleNoSpeech}
            />
          </div>

          {/* Conversation log */}
          <TranscriptPanel entries={transcript} />
        </div>
      </div>
    </div>
  );
};

export default CanteenScenario;
