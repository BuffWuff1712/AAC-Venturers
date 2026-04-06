import React, { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { SessionResult } from "../../types/scenario";

const CHECKLIST_ITEMS = [
  "Started with a greeting",
  "Responded to all questions",
  "Recording is clear and loud",
];

const CaregiverEvaluationPage: React.FC = () => {
  const router = useRouter();

  const rawResult = Array.isArray(router.query.result)
    ? router.query.result[0]
    : router.query.result;

  const result = useMemo<SessionResult | null>(() => {
    if (!router.isReady || !rawResult) return null;
    try {
      return JSON.parse(rawResult) as SessionResult;
    } catch {
      console.error("Could not parse session result.");
      return null;
    }
  }, [router.isReady, rawResult]);

  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(CHECKLIST_ITEMS.map((item) => [item, false]))
  );

  const toggleCheck = (item: string) => {
    setChecked((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!childName.trim() || !childAge.trim()) {
      alert("Please fill in the child's name and age before submitting.");
      return;
    }

    setSubmitted(true);
  };

  const fmtMs = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

  return (
    <div className="min-h-screen bg-page-peach font-fredoka flex flex-col items-center px-4 py-8 gap-8">
      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-lg space-y-4">
        <h2 className="text-2xl font-black text-text-brown">Caregiver Checklist</h2>
        {CHECKLIST_ITEMS.map((item) => (
          <label
            key={item}
            className="flex items-center gap-4 cursor-pointer group"
            onClick={() => toggleCheck(item)}
          >
            <div
              className={`
                w-8 h-8 rounded-xl border-4 flex items-center justify-center transition-all
                ${
                  checked[item]
                    ? "bg-child-green border-child-green"
                    : "border-gray-300 group-hover:border-purple-400"
                }
              `}
            >
              {checked[item] && (
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <span className="text-lg font-semibold text-gray-700">{item}</span>
          </label>
        ))}
      </div>

      {result && (
        <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-lg space-y-4">
          <h2 className="text-2xl font-black text-text-brown">Session Analytics</h2>

          <div className="space-y-2">
            <p className="font-bold text-gray-500 uppercase text-xs tracking-widest">
              Response Time per Prompt
            </p>
            {result.analytics.map((analytic, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-2"
              >
                <span className="font-semibold text-gray-700">{analytic.label}</span>
                <span className="font-black text-purple-600">
                  {fmtMs(analytic.responseTimeMs)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center bg-yellow-50 rounded-xl px-4 py-2">
            <span className="font-semibold text-gray-700">Hints used</span>
            <span className="font-black text-yellow-600">
              {result.analytics.reduce((sum, analytic) => sum + analytic.hintsUsed, 0)}
            </span>
          </div>

          <div className="flex justify-between items-center bg-green-50 rounded-xl px-4 py-2">
            <span className="font-semibold text-gray-700">Tasks completed</span>
            <span className="font-black text-green-600">
              {result.completedSteps} / {result.totalSteps}
            </span>
          </div>
        </div>
      )}

      {result && (
        <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-lg space-y-4">
          <h2 className="text-2xl font-black text-text-brown">
            Listen to the Student&apos;s Conversation
          </h2>

          {result.audioBlob ? (
            <audio
              controls
              src={URL.createObjectURL(result.audioBlob)}
              className="w-full rounded-xl"
            />
          ) : (
            <div className="bg-gray-100 rounded-xl px-4 py-3 text-gray-400 font-semibold text-center">
              Audio recording not available in this session.
            </div>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {result.transcript.map((entry, idx) => (
              <div key={idx} className="flex gap-2 text-base leading-snug">
                <span
                  className={`font-extrabold shrink-0 ${
                    entry.speaker === "child" ? "text-blue-600" : "text-purple-600"
                  }`}
                >
                  {entry.label}:
                </span>
                <span className="text-gray-700">{entry.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-lg space-y-5">
        <h2 className="text-2xl font-black text-text-brown">Caregiver Evaluation</h2>

        {submitted ? (
          <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-6 text-center space-y-2">
            <p className="font-black text-green-700 text-xl">Evaluation Submitted!</p>
            <p className="text-green-600 font-medium">
              This session has been recorded for {childName} (Age {childAge}).
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <p className="font-bold text-gray-500 uppercase text-xs tracking-widest">
                Child Information
              </p>
              <input
                type="text"
                placeholder="Child's Name"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-lg font-semibold focus:border-purple-400 focus:outline-none transition-colors"
              />
              <input
                type="number"
                placeholder="Child's Age"
                value={childAge}
                onChange={(e) => setChildAge(e.target.value)}
                min={1}
                max={18}
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-lg font-semibold focus:border-purple-400 focus:outline-none transition-colors"
              />
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-purple-500 hover:bg-purple-400 text-white font-black py-4 rounded-2xl text-xl shadow-[0_6px_0_#7c3aed] active:shadow-none active:translate-y-1 transition-all"
            >
              Submit Evaluation
            </button>
          </>
        )}
      </div>

      <button
        onClick={() => router.push("/scenarios")}
        className="w-full max-w-2xl bg-caregiver-peach hover:bg-[#ffc891] text-text-brown font-black py-4 rounded-2xl text-xl shadow-[0_5px_0_#e6b181] active:shadow-none active:translate-y-[5px] transition-all"
      >
        Back to Scenarios
      </button>
    </div>
  );
};

export default CaregiverEvaluationPage;
