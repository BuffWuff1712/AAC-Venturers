import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { api } from "@/api/client";

function formatSeconds(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return `${value.toFixed(1)} seconds`;
}

function formatSuccessRate(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return `${Math.round(value * 100)}%`;
}

function formatDateTime(value) {
  if (!value) {
    return { date: "-", time: "-" };
  }

  const date = new Date(value);

  return {
    date: date.toLocaleDateString("en-SG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-SG", {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

const emptyAnalytics = {
  avgResponseTime: 0,
  longestResponseTime: 0,
  shortestResponseTime: 0,
  successRate: 0,
};

const Analytics = () => {
  const router = useRouter();
  const { sessionId, scenarioId, scenarioTitle } = router.query;
  const [sessionDetails, setSessionDetails] = useState(null);
  const [sessionAnalytics, setSessionAnalytics] = useState(emptyAnalytics);

  useEffect(() => {
    if (!router.isReady || !sessionId) return;

    let isMounted = true;

    const loadAnalytics = async () => {
      try {
        const [details, analytics] = await Promise.all([
          api.getChildSession(sessionId),
          api.getCaregiverSessionAnalytics(sessionId),
        ]);

        if (!isMounted) return;
        setSessionDetails(details || null);
        setSessionAnalytics(analytics || emptyAnalytics);
      } catch {
        if (!isMounted) return;
        setSessionDetails(null);
        setSessionAnalytics(emptyAnalytics);
      }
    };

    loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, [router.isReady, sessionId]);

  const interactionSummaries = useMemo(() => {
    if (!Array.isArray(sessionDetails?.interactions)) return [];

    return sessionDetails.interactions.map((interaction) => {
      const firstResponse = Array.isArray(interaction.responses)
        ? interaction.responses[0]
        : null;

      return {
        question: interaction.questionText || "Prompt",
        responseTime: firstResponse?.responseTimeSeconds ?? null,
        isSuccessful: Boolean(firstResponse?.isSuccessful),
        responseText: firstResponse?.responseText || "",
      };
    });
  }, [sessionDetails]);

  const derivedObjectives = useMemo(() => {
    if (!sessionDetails) return [];

    const objectives = [];

    if (sessionDetails.totalQuestions > 0) {
      objectives.push(
        `Answered ${sessionDetails.successfulFirstAttempts || 0} of ${sessionDetails.totalQuestions} prompt(s) successfully on the first try`
      );
    }

    if (sessionDetails.xpEarned > 0) {
      objectives.push(`Earned ${sessionDetails.xpEarned} XP in this session`);
    }

    if (sessionDetails.endTime) {
      objectives.push("Completed the conversation flow");
    }

    return objectives;
  }, [sessionDetails]);

  const longestQuestion = useMemo(() => {
    if (interactionSummaries.length === 0) return "No interaction data yet.";

    const match = [...interactionSummaries].sort(
      (a, b) => (b.responseTime || 0) - (a.responseTime || 0)
    )[0];

    return match.question;
  }, [interactionSummaries]);

  const shortestQuestion = useMemo(() => {
    if (interactionSummaries.length === 0) return "No interaction data yet.";

    const match = [...interactionSummaries].sort(
      (a, b) => (a.responseTime || Number.MAX_SAFE_INTEGER) - (b.responseTime || Number.MAX_SAFE_INTEGER)
    )[0];

    return match.question;
  }, [interactionSummaries]);

  const transcript = useMemo(() => {
    if (!Array.isArray(sessionDetails?.interactions)) return [];

    return sessionDetails.interactions.flatMap((interaction) => {
      const rows = [
        {
          speaker: "AI",
          text: interaction.questionText || "",
        },
      ];

      if (Array.isArray(interaction.responses)) {
        interaction.responses.forEach((response) => {
          rows.push({
            speaker: "Child",
            text: response.responseText || "",
          });
        });
      }

      return rows;
    });
  }, [sessionDetails]);

  const formattedDate = formatDateTime(sessionDetails?.startTime);
  const pageTitle =
    typeof scenarioTitle === "string" && scenarioTitle.trim()
      ? scenarioTitle
      : "Canteen";

  const handlePlayRecording = () => {
    alert("Conversation recording playback is not available yet.");
  };

  return (
    <div className="min-h-screen bg-page-peach p-6 font-fredoka">
      <button
        onClick={() =>
          router.push({
            pathname: "/History",
            query: {
              scenarioId,
              scenarioTitle,
            },
          })
        }
        className="mb-8 flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-black text-text-brown shadow-[0_4px_0_#e5e7eb] transition-all hover:translate-y-[4px] hover:shadow-none active:scale-95"
      >
        <span className="text-2xl">←</span> Back
      </button>

      <div className="mx-auto mb-10 max-w-6xl text-center">
        <h1 className="mb-3 text-6xl font-black text-text-brown">
          Session Analytics
        </h1>
        <p className="text-2xl font-bold text-text-brown opacity-70">
          Review detailed performance for a selected practice session
        </p>
      </div>

      <div className="mx-auto mb-8 max-w-6xl rounded-[36px] border-b-8 border-gray-200 bg-white p-6 shadow-xl">
        <h2 className="text-3xl font-black text-text-brown">
          {pageTitle} Scenario
        </h2>
        <p className="mt-2 text-lg font-medium text-gray-600">
          Session • {formattedDate.date} • {formattedDate.time}
        </p>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-[32px] border-b-8 border-gray-200 bg-white p-6 shadow-xl">
          <h3 className="mb-3 text-2xl font-black text-text-brown">
            Average Response Time
          </h3>
          <p className="text-4xl font-black text-child-green">
            {formatSeconds(sessionAnalytics.avgResponseTime)}
          </p>
        </div>

        <div className="rounded-[32px] border-b-8 border-gray-200 bg-white p-6 shadow-xl">
          <h3 className="mb-3 text-2xl font-black text-text-brown">
            Success Rate
          </h3>
          <p className="text-4xl font-black text-child-green">
            {formatSuccessRate(sessionAnalytics.successRate)}
          </p>
          <p className="mt-3 text-sm font-medium text-gray-500">
            Number of questions answered first time without prompt from AI / Total number of questions asked by AI
          </p>
        </div>

        <div className="rounded-[32px] border-b-8 border-gray-200 bg-white p-6 shadow-xl">
          <h3 className="mb-3 text-2xl font-black text-text-brown">
            Question With Longest Response Time
          </h3>
          <p className="mb-3 text-xl font-bold text-text-brown">
            {longestQuestion}
          </p>
          <div className="inline-block rounded-2xl bg-caregiver-peach px-4 py-2 text-lg font-black text-text-brown">
            {formatSeconds(sessionAnalytics.longestResponseTime)}
          </div>
        </div>

        <div className="rounded-[32px] border-b-8 border-gray-200 bg-white p-6 shadow-xl">
          <h3 className="mb-3 text-2xl font-black text-text-brown">
            Question With Shortest Response Time
          </h3>
          <p className="mb-3 text-xl font-bold text-text-brown">
            {shortestQuestion}
          </p>
          <div className="inline-block rounded-2xl bg-child-green px-4 py-2 text-lg font-black text-text-brown">
            {formatSeconds(sessionAnalytics.shortestResponseTime)}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-6xl rounded-[36px] border-b-8 border-gray-200 bg-white p-6 shadow-xl">
        <h2 className="mb-6 text-3xl font-black text-text-brown">
          Caregiver Checklist: Objectives Checked
        </h2>

        {derivedObjectives.length === 0 ? (
          <p className="text-lg font-medium text-gray-500">
            No objectives were checked for this session.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {derivedObjectives.map((objective, index) => (
              <div
                key={`${objective}-${index}`}
                className="flex items-center gap-3 rounded-2xl bg-[#FFF9F5] px-5 py-4"
              >
                <span className="text-2xl">✅</span>
                <p className="text-lg font-bold text-text-brown">{objective}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto mt-8 max-w-6xl rounded-[36px] border-b-8 border-gray-200 bg-white p-6 shadow-xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-3xl font-black text-text-brown">
            Conversation Recording
          </h2>

          <button
            onClick={handlePlayRecording}
            disabled
            className="cursor-not-allowed rounded-2xl bg-gray-200 px-6 py-3 text-lg font-black text-gray-400 transition-all"
          >
            ▶ Play Recording
          </button>
        </div>

        <h3 className="mb-4 text-2xl font-black text-text-brown">Transcript</h3>

        {transcript.length === 0 ? (
          <div className="rounded-[28px] bg-page-peach p-8 text-center">
            <p className="text-lg font-bold text-text-brown">
              No transcript available for this session yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {transcript.map((entry, index) => (
              <div
                key={`${entry.speaker}-${index}`}
                className={`rounded-[24px] px-5 py-4 ${
                  entry.speaker === "AI"
                    ? "bg-caregiver-peach/50"
                    : "bg-child-green/50"
                }`}
              >
                <p className="mb-1 text-sm font-black uppercase text-gray-500">
                  {entry.speaker}
                </p>
                <p className="text-lg font-bold text-text-brown">{entry.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
