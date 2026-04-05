"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Card } from "../components/Card";
import { useChildSession } from "../context/ChildSessionContext";

export function ChildScenarioSelectionView() {
  const router = useRouter();
  const { setSessionSnapshot } = useChildSession();
  const [scenarios, setScenarios] = useState([]);
  const [childId, setChildId] = useState("");
  const [childName, setChildName] = useState("Sample Child");

  useEffect(() => {
    Promise.all([
      api.getChildScenarios(),
      api.login({ role: "child" }),
    ]).then(([scenarioData, loginData]) => {
      setScenarios(scenarioData);
      setChildId(loginData.user.childId);
      setChildName(loginData.user.name);
    });
  }, []);

  async function handleStart(scenarioId) {
    const session = await api.startSession({ scenarioId, childId });
    setSessionSnapshot({
      sessionId: session.sessionId,
      scenario: session.scenario,
      messages: session.messages,
      childId,
      childName,
    });
    router.push(`/child/session/${session.sessionId}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
      <Card className="bg-white/95">
        <p className="text-sm uppercase tracking-[0.3em] text-coral">Child Practice</p>
        <h2 className="mt-3 text-3xl font-semibold text-ink">Choose today&apos;s canteen mission</h2>
        <p className="mt-3 text-slate-600">
          This prototype focuses on one complete role-play flow with a guided western stall owner.
        </p>
        <label className="mt-6 block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Child name</span>
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-coral focus:ring-2"
            value={childName}
            onChange={(event) => setChildName(event.target.value)}
          />
        </label>
        <div className="mt-6 rounded-[24px] bg-slate-100 p-5">
          <p className="text-sm font-medium text-slate-700">Voice input</p>
          <p className="mt-2 text-sm text-slate-500">
            Microphone mode is a placeholder in this prototype. Text chat is fully functional.
          </p>
        </div>
        <div className="mt-4 rounded-[24px] bg-sand p-5">
          <p className="text-sm font-medium text-slate-700">Practice tip</p>
          <p className="mt-2 text-sm text-slate-600">
            Try saying the food first, then add choices like no coleslaw or chilli on the side.
          </p>
        </div>
      </Card>

      <div className="space-y-4">
        {scenarios.map((scenario) => (
          <Card key={scenario.scenarioId} className="bg-white/95">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-ink">{scenario.title}</h3>
                <p className="mt-2 text-slate-600">
                  Practice ordering from the western stall during school recess.
                </p>
                <p className="mt-4 text-sm font-medium text-slate-700">
                  Goal: Order a food item clearly and complete the purchase.
                </p>
              </div>
              <button
                onClick={() => handleStart(scenario.scenarioId)}
                className="rounded-2xl bg-coral px-5 py-3 font-medium text-white"
              >
                Start practice
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
