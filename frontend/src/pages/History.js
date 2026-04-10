import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { api } from "@/api/client";

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

function formatDuration(startTime, endTime) {
  if (!startTime || !endTime) return "-";

  const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();
  const durationMinutes = Math.max(0, Math.round(durationMs / 60000));

  if (durationMinutes < 1) return "< 1 min";

  return `${durationMinutes} mins`;
}

const History = () => {
  const router = useRouter();
  const { scenarioId, scenarioTitle } = router.query;
  const [practiceSessions, setPracticeSessions] = useState([]);

  useEffect(() => {
    if (!router.isReady) return;

    let isMounted = true;

    const loadHistory = async () => {
      if (!scenarioId) {
        setPracticeSessions([]);
        return;
      }

      try {
        const data = await api.getCaregiverScenarioHistory(scenarioId);
        if (!isMounted) return;
        setPracticeSessions(Array.isArray(data) ? data : []);
      } catch {
        if (!isMounted) return;
        setPracticeSessions([]);
      }
    };

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [router.isReady, scenarioId]);

  const sessions = useMemo(
    () =>
      practiceSessions.map((session, index) => {
        const formatted = formatDateTime(session.start_time);

        return {
          id: session.session_id,
          label: `Session #${index + 1}`,
          date: formatted.date,
          time: formatted.time,
          duration: formatDuration(session.start_time, session.end_time),
          result: session.end_time ? "Completed" : "Incomplete",
        };
      }),
    [practiceSessions]
  );

  const title =
    typeof scenarioTitle === "string" && scenarioTitle.trim()
      ? scenarioTitle
      : "Canteen";

  return (
    <div className="min-h-screen bg-page-peach p-6 font-fredoka">
      <button
        onClick={() => router.push("/ManageScenario")}
        className="mb-8 flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-black text-text-brown shadow-[0_4px_0_#e5e7eb] transition-all hover:translate-y-[4px] hover:shadow-none active:scale-95"
      >
        <span className="text-2xl">←</span> Back
      </button>

      <div className="mx-auto mb-10 max-w-6xl text-center">
        <h1 className="mb-3 text-6xl font-black text-text-brown">
          Scenario History
        </h1>
        <p className="text-2xl font-bold text-text-brown opacity-70">
          View all previous practice sessions for this scenario
        </p>
      </div>

      <div className="mx-auto mb-8 max-w-6xl rounded-[36px] border-b-8 border-gray-200 bg-white p-6 shadow-xl">
        <h2 className="mb-2 text-3xl font-black text-text-brown">
          {title} Scenario
        </h2>
        <p className="text-lg font-medium text-gray-600">
          Total Sessions: {sessions.length}
        </p>
      </div>

      <div className="mx-auto max-w-6xl rounded-[36px] border-b-8 border-gray-200 bg-white p-6 shadow-xl">
        <h2 className="mb-6 text-3xl font-black text-text-brown">
          Previous Practice Sessions
        </h2>

        {sessions.length === 0 ? (
          <div className="rounded-[28px] bg-page-peach p-10 text-center">
            <p className="text-2xl font-bold text-text-brown">
              No practice sessions found yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="rounded-[28px] border-2 border-gray-100 bg-[#FFF9F5] p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-text-brown">
                      {session.label}
                    </h3>
                    <p className="mt-1 text-lg font-medium text-gray-600">
                      {session.date} • {session.time}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:w-[40%]">
                    <div className="rounded-2xl bg-white px-4 py-3 text-center">
                      <p className="text-sm font-bold text-gray-500">Duration</p>
                      <p className="text-lg font-black text-text-brown">
                        {session.duration}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-3 text-center">
                      <p className="text-sm font-bold text-gray-500">Result</p>
                      <p
                        className={`text-lg font-black ${
                          session.result === "Completed"
                            ? "text-green-600"
                            : "text-orange-500"
                        }`}
                      >
                        {session.result}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      router.push({
                        pathname: "/Analytics",
                        query: {
                          sessionId: session.id,
                          scenarioId,
                          scenarioTitle: title,
                        },
                      })
                    }
                    className="rounded-2xl bg-child-green px-5 py-3 text-lg font-black text-text-brown shadow-[0_5px_0_#92c45e] transition-all hover:translate-y-[5px] hover:shadow-none"
                  >
                    View Analytics →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
