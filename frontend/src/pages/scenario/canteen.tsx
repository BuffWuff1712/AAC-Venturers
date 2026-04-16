import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import InstructionBanner from "@/components/scenario/InstructionBanner";
import CharacterStage from "@/components/scenario/CharacterStage";
import TranscriptPanel from "@/components/scenario/TranscriptPanel";
import RecordingIndicator from "@/components/scenario/RecordingIndicator";
import AchievementBanner from "@/components/scenario/AchievementBanner";
import { api, getStoredUser, saveAuthSession } from "@/api/client";
import { PromptAnalytic, SessionResult, TranscriptEntry } from "../../types/scenario";

const DEFAULT_SCENARIO_ID = "scenario-001";
const FALLBACK_TITLE = "Canteen";
const FALLBACK_AVATAR_IMAGE = "/images/cook.png";
const FALLBACK_OBJECTIVES = [
  "Order at least one menu item clearly",
  "Complete the purchase interaction",
];
const DEFAULT_HINT_DELAY_MS = 5_000;

function getAvatarFallbackImage(avatarType?: string) {
  if (avatarType === "student") {
    return "/images/student.png";
  }

  if (avatarType === "teacher") {
    return "/images/teacher.png";
  }

  return FALLBACK_AVATAR_IMAGE;
}

function getAvatarLabel(avatarType?: string, avatarLabel?: string) {
  if (typeof avatarLabel === "string" && avatarLabel.trim()) {
    return avatarLabel.trim();
  }

  if (avatarType === "student") {
    return "Student";
  }

  if (avatarType === "teacher") {
    return "Teacher";
  }

  return "Stall Owner";
}

type ScenarioObjective = {
  description?: string;
};

function resolveAvatarImage(avatarImageUrl?: string, avatarType?: string) {
  const fallbackImage = getAvatarFallbackImage(avatarType);

  if (typeof avatarImageUrl !== "string") {
    return fallbackImage;
  }

  const normalizedImage = avatarImageUrl.trim();

  if (!normalizedImage) {
    return fallbackImage;
  }

  if (
    normalizedImage.startsWith("http://") ||
    normalizedImage.startsWith("https://") ||
    normalizedImage.startsWith("blob:")
  ) {
    return normalizedImage;
  }

  if (normalizedImage.startsWith("/uploads/")) {
    const backendBase =
      process.env.NEXT_PUBLIC_API_BASE?.replace(/\/api$/, "") || "http://localhost:4000";
    return `${backendBase}${normalizedImage}`;
  }

  return normalizedImage;
}

const CanteenScenario: React.FC = () => {
  const router = useRouter();
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [analytics, setAnalytics] = useState<PromptAnalytic[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(20);
  const [showAchievement, setShowAchievement] = useState(false);
  const [scenarioDone, setScenarioDone] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [scenarioTitle, setScenarioTitle] = useState(FALLBACK_TITLE);
  const [scenarioObjectives, setScenarioObjectives] = useState(FALLBACK_OBJECTIVES);
  const [characterImage, setCharacterImage] = useState("");
  const [characterLabel, setCharacterLabel] = useState("Loading");
  const [hintDelayMs, setHintDelayMs] = useState(DEFAULT_HINT_DELAY_MS);
  const [completedObjectiveCount, setCompletedObjectiveCount] = useState(0);
  const [characterSpeech, setCharacterSpeech] = useState("Starting session...");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPaused, setIsPaused] = useState(false);

  const promptStartRef = useRef<number>(Date.now());
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSteps = Math.max(scenarioObjectives.length, 1);
  const currentStep = Math.min(
    completedObjectiveCount + 1,
    totalSteps
  );

  const addEntry = useCallback(
    (speaker: TranscriptEntry["speaker"], label: string, text: string) => {
      setTranscript((prev) => [
        ...prev,
        { speaker, label, text, timestamp: Date.now() },
      ]);
    },
    []
  );

  const startCountdown = useCallback(() => {
    // setCountdown(30);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((value) => {
        if (value <= 1) {
          clearInterval(countdownIntervalRef.current!);
          return 0;
        }

        return value - 1;
      });
    }, 1000);
  }, []);

  const stopCountdown = useCallback(() => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  }, []);

  const prepareChildUser = useCallback(async () => {
    const storedUser = getStoredUser();

    if (storedUser?.childId) {
      return storedUser;
    }

    const payload = await api.login({ role: "child" });
    saveAuthSession(payload);
    return payload.user;
  }, []);

  useEffect(() => {
    if (!router.isReady) return;

    let isMounted = true;

    const startScenario = async () => {
      setIsLoadingSession(true);
      setErrorMessage("");
      setCharacterImage("");
      setCharacterLabel("Loading");
      setCharacterSpeech("");

      try {
        const childUser = await prepareChildUser();
        const storedChildDisplayName =
          typeof window !== "undefined"
            ? window.localStorage.getItem("childDisplayName") || ""
            : "";
        const scenarioId =
          typeof router.query.scenarioId === "string" && router.query.scenarioId
            ? router.query.scenarioId
            : DEFAULT_SCENARIO_ID;

        const response = await api.startChildSession({
          scenarioId,
          childId: childUser.childId,
          childName: storedChildDisplayName.trim(),
        });

        // ─── LINKING THE VOLUME HERE ───
        if (bgAudioRef.current && response.scenario?.settings) {
          // Get the noise level from the API response (e.g., 20)
          const noiseLevel = Number(response.scenario.settings.backgroundNoise || 0);

          // Convert to a 0.0 - 1.0 scale
          bgAudioRef.current.volume = noiseLevel / 100;

          // If noise is set to 0, we can just mute it
          bgAudioRef.current.muted = noiseLevel === 0;
        }
        // ───────────────────────────────


        if (!isMounted) return;

        const openingMessage = Array.isArray(response.messages)
          ? response.messages[0]
          : null;

        setSessionId(response.sessionId || "");
        setScenarioTitle(response.scenario?.title || FALLBACK_TITLE);
        setCharacterImage(
          resolveAvatarImage(response.scenario?.avatarImageUrl, response.scenario?.avatarType)
        );
        setCharacterLabel(
          getAvatarLabel(response.scenario?.avatarType, response.scenario?.avatarLabel)
        );
        setHintDelayMs(
          Math.max(1, Number(response.scenario?.hintDelaySeconds) || 20) * 1000
        );
        setScenarioObjectives(
          Array.isArray(response.scenario?.objectives) && response.scenario.objectives.length
            ? response.scenario.objectives.map((objective: ScenarioObjective) => objective.description || "")
            : FALLBACK_OBJECTIVES
        );
        setCompletedObjectiveCount(Number(response.completedObjectiveCount || 0));
        setCharacterSpeech(
          openingMessage?.message || "Hi there! What would you like today?"
        );

        if (openingMessage?.message) {
          addEntry(
            "friend",
            getAvatarLabel(response.scenario?.avatarType, response.scenario?.avatarLabel),
            openingMessage.message
          );
        }

        promptStartRef.current = Date.now();
        setCountdown(20);
        setIsRecording(true);
        setCountdown(20);
        startCountdown();
      } catch (err) {
        if (!isMounted) return;

        setErrorMessage(err instanceof Error ? err.message : "Unable to start the scenario.");
        setCharacterSpeech("We couldn't start the conversation just yet.");
        setIsRecording(false);
      } finally {
        if (isMounted) {
          setIsLoadingSession(false);
        }
      }
    };

    startScenario();

    return () => {
      isMounted = false;
      stopCountdown();
    };
  }, [addEntry, prepareChildUser, router.isReady, router.query.scenarioId, startCountdown, stopCountdown]);

  useEffect(() => {
    // 1. Initialize the audio
    bgAudioRef.current = new Audio("/audio/canteen_bg.mp3");
    bgAudioRef.current.loop = true;
    bgAudioRef.current.volume = 0.15; // Keep it low (15%) so it's not overwhelming

    // 2. Start playing when the session starts
    // Note: Most browsers require a user interaction (like the "Let's Go" button) 
    // to allow audio to play.
    const playAudio = () => {
      bgAudioRef.current?.play().catch(err => console.log("Audio play blocked", err));
    };

    playAudio();

    // 3. Cleanup: Stop the noise when leaving the page or finishing
    return () => {
      bgAudioRef.current?.pause();
      bgAudioRef.current = null;
    };
  }, []);


  const handleTranscript = useCallback(
    async (text: string) => {
      if (!sessionId || isSubmitting || scenarioDone) {
        return;
      }

      setIsSubmitting(true);
      setErrorMessage("");
      setIsRecording(false);
      stopCountdown();

      const responseMs = Date.now() - promptStartRef.current;
      const childTurnNumber =
        transcript.filter((entry) => entry.speaker === "child").length + 1;

      addEntry("child", "You", text);

      try {
        const response = await api.sendChildMessage(sessionId, {
          input: text,
          inputMode: "text",
          responseTimeMs: responseMs,
        });

        const nextAnalytic: PromptAnalytic = {
          stepId: childTurnNumber,
          label: `Turn ${childTurnNumber} response`,
          responseTimeMs: responseMs,
          hintsUsed: 0,
        };

        setAnalytics((prev) => [...prev, nextAnalytic]);

        if (response?.message) {
          addEntry("friend", characterLabel, response.message);
          setCharacterSpeech(response.message);
        }

        setCompletedObjectiveCount(Number(response?.completedObjectiveCount || 0));

        if (response?.status === "completed") {
          const totalMs = analytics.reduce(
            (sum, item) => sum + item.responseTimeMs,
            responseMs
          );

          if (totalMs < 10000) {
            setShowAchievement(true);
          }

          const result: SessionResult = {
            scenarioId:
              typeof router.query.scenarioId === "string"
                ? router.query.scenarioId
                : DEFAULT_SCENARIO_ID,
            scenarioTitle,
            transcript: [
              ...transcript,
              { speaker: "child", label: "You", text, timestamp: Date.now() },
              ...(response?.message
                ? [
                  {
                    speaker: "friend" as const,
                    label: characterLabel,
                    text: response.message,
                    timestamp: Date.now(),
                  },
                ]
                : []),
            ],
            analytics: [...analytics, nextAnalytic],
            totalSteps,
            completedSteps: totalSteps,
            totalResponseTimeMs: totalMs,
          };

          stopCountdown();
          setIsRecording(false);
          setScenarioDone(true);

          setTimeout(() => {
            router.push({
              pathname: "/celebration",
              query: {
                result: JSON.stringify(result),
                from: "canteen",
                sessionId,
              },
            });
          }, totalMs < 10000 ? 4500 : 1000);

          return;
        }

        promptStartRef.current = Date.now();
        setCountdown(20);
        setIsRecording(true);
        startCountdown();
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : "Unable to send your response."
        );
        setIsRecording(true);
        startCountdown();
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      addEntry,
      analytics,
      isSubmitting,
      router,
      scenarioDone,
      scenarioTitle,
      characterLabel,
      sessionId,
      startCountdown,
      stopCountdown,
      totalSteps,
      transcript,
    ]
  );

  const handleNoSpeech = useCallback(async () => {
    if (!sessionId || isSubmitting || scenarioDone || isLoadingSession) {
      return;
    }

    try {
      const response = await api.requestChildHint(sessionId);
      if (response?.hint) {
        addEntry("friend", characterLabel, response.hint);
        setCharacterSpeech(response.hint);
      }
    } catch (err) {
      console.error("Unable to request hint:", err);
    }
  }, [addEntry, characterLabel, isLoadingSession, isSubmitting, scenarioDone, sessionId]);

  useEffect(() => {
    return () => {
      stopCountdown();
    };
  }, [stopCountdown]);

  const instructionText = useMemo(() => {
    if (errorMessage) {
      return errorMessage;
    }

    if (isLoadingSession) {
      return "Setting up your practice session...";
    }

    return (
      scenarioObjectives[Math.min(completedObjectiveCount, Math.max(scenarioObjectives.length - 1, 0))] ||
      `Listen carefully and respond to the ${characterLabel.toLowerCase()}.`
    );
  }, [characterLabel, completedObjectiveCount, errorMessage, isLoadingSession, scenarioObjectives]);

  const handleRestart = useCallback(() => {
    // Clear everything
    setTranscript([]);
    setAnalytics([]);
    setIsPaused(false);
    setScenarioDone(false);
    setErrorMessage("");

    // Re-trigger the initial sequence
    router.reload(); // Simplest way to restart a dynamic API-driven session
  }, [router]);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    setIsRecording(true);
    startCountdown();
    bgAudioRef.current?.play(); // Resume noise
    promptStartRef.current = Date.now(); // Reset timer so child isn't penalized for the pause
  }, [startCountdown]);



  return (
    <div className="relative h-screen w-screen overflow-hidden font-fredoka">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/canteen_bg.png "
          alt="School canteen"
          fill
          className="object-fill opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-white/20" />
      </div>

      <AchievementBanner
        show={showAchievement}
        achievementName="Quick Responder"
        durationMs={4000}
      />

      <div className="relative z-10 flex h-full flex-col gap-3 p-4">
        <InstructionBanner
          currentStep={currentStep}
          totalSteps={totalSteps}
          instruction={instructionText}
          timeRemaining={isRecording ? countdown : undefined}
        />

        <div className="flex flex-1 items-center justify-center">
          <CharacterStage
            characterImage={characterImage}
            characterName={characterLabel}
            speech={characterSpeech}
            isListening={isRecording}
            isLoading={isLoadingSession}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-center">
            <RecordingIndicator
              isRecording={isRecording && !scenarioDone && !isLoadingSession}
              onTranscript={handleTranscript}
              onNoSpeech={handleNoSpeech}
              silenceTimeoutMs={hintDelayMs}
              onStop={() => {
                setIsRecording(false);
                stopCountdown();
                setIsPaused(true); // Open the modal
                bgAudioRef.current?.pause();
              }}
            />
          </div>

          {/* ─── NEW PAUSE MODAL UI ─────────────────────────────────────────────────── */}
          {isPaused && (
            <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
              <div className="w-full max-w-sm rounded-[50px] bg-white p-10 shadow-2xl border-8 border-caregiver-peach animate-in zoom-in duration-300 text-center">

                <div className="text-6xl mb-4">⏸️</div>
                <h2 className="text-3xl font-black text-text-brown mb-2">Session Paused</h2>
                <p className="text-lg font-medium text-gray-500 mb-8">What would you like to do?</p>

                <div className="flex flex-col gap-4">
                  <button
                    onClick={handleResume}
                    className="w-full bg-child-green hover:brightness-95 text-text-brown font-black py-4 rounded-3xl text-xl shadow-[0_6px_0_#92c45e] active:translate-y-1 active:shadow-none transition-all"
                  >
                    ▶️ Resume Session
                  </button>

                  <button
                    onClick={handleRestart}
                    className="w-full bg-white border-4 border-caregiver-peach text-text-brown font-black py-4 rounded-3xl text-xl hover:bg-orange-50 transition-all"
                  >
                    🔄 Start Over
                  </button>

                  <button
                    onClick={() => router.push("/scenarios")}
                    className="mt-2 text-gray-400 font-bold hover:text-red-500 transition-colors"
                  >
                    Quit Practice
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* ─────────────────────────────────────────────────────────────────────────── */}

          <TranscriptPanel entries={transcript} />
        </div>
      </div>
    </div>
  );
};

export default CanteenScenario;
