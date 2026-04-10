"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { Card } from "../components/Card";

const personalities = [
  { value: "impatient", title: "Impatient", description: "Brisk and a little rushed during recess." },
  {
    value: "hard_of_hearing",
    title: "Hard of hearing",
    description: "Often asks the child to repeat clearly.",
  },
  {
    value: "personable_familiar",
    title: "Personable and familiar",
    description: "Warm and may recall the child's usual order.",
  },
];

export function EditScenarioView() {
  const searchParams = useSearchParams();
  const scenarioId = searchParams.get("scenarioId") || "scenario-001";
  const [state, setState] = useState({
    personality: "personable_familiar",
    memoryEnabled: true,
  });
  const [saved, setSaved] = useState(false);
  const [scenarioTitle, setScenarioTitle] = useState("Western Stall at school canteen");

  const personalityPrompt = useMemo(() => {
    const baseMap = {
      impatient:
        "You are a western food stall owner at a school canteen. Keep replies short, brisk, and kind because recess is busy.",
      hard_of_hearing:
        "You are a western food stall owner at a school canteen. You are slightly hard of hearing, so you sometimes ask the child to repeat clearly while staying supportive.",
      personable_familiar:
        "You are a friendly and patient western food stall owner at a school canteen. Be personable and familiar with the children.",
    };

    const memorySuffix = state.memoryEnabled
      ? " If it feels natural, remember the child's usual order."
      : " Do not reference a usual order or prior memory.";

    return `${baseMap[state.personality]}${memorySuffix}`;
  }, [state.memoryEnabled, state.personality]);

  useEffect(() => {
    api.getScenario(scenarioId).then((data) => {
      const prompt = data.settings?.aiPersonalityPrompt || "";
      const combined = `${prompt} ${data.settings?.contingencies || ""}`.toLowerCase();
      const personality = combined.includes("hard of hearing")
        ? "hard_of_hearing"
        : combined.includes("brisk") || combined.includes("busy") || combined.includes("impatient")
          ? "impatient"
          : "personable_familiar";

      setScenarioTitle(data.scenario.title || "Western Stall at school canteen");
      setState({
        personality,
        memoryEnabled:
          combined.includes("usual") || combined.includes("remember") || combined.includes("familiar"),
      });
    });
  }, [scenarioId]);

  async function handleSave() {
    await api.updateScenario(scenarioId, {
      locationName: scenarioTitle,
      locationImageUrl: "/images/western-stall.jpg",
      backgroundNoise: 20,
      aiPersonalityPrompt: personalityPrompt,
      contingencies: state.memoryEnabled
        ? "If the child struggles, offer the menu and, when natural, suggest their usual order."
        : "If the child struggles, offer the menu and ask a simple follow-up question.",
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
      <Card className="bg-white/95">
        <p className="text-sm uppercase tracking-[0.3em] text-coral">Scenario Editor</p>
        <h2 className="mt-3 text-3xl font-semibold text-ink">{scenarioTitle}</h2>
        <p className="mt-3 text-slate-600">
          Adjust the stall owner style and decide whether the child&apos;s favourite order should be
          available as memory.
        </p>

        <div className="mt-8 grid gap-4">
          {personalities.map((personality) => (
            <button
              key={personality.value}
              type="button"
              onClick={() =>
                setState((current) => ({ ...current, personality: personality.value }))
              }
              className={`rounded-[24px] border p-5 text-left transition ${
                state.personality === personality.value
                  ? "border-coral bg-coral/10"
                  : "border-slate-200 bg-slate-50 hover:border-slate-300"
              }`}
            >
              <p className="text-lg font-semibold text-ink">{personality.title}</p>
              <p className="mt-2 text-sm text-slate-600">{personality.description}</p>
            </button>
          ))}
        </div>

        <label className="mt-8 flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <div>
            <p className="text-lg font-semibold text-ink">Enable child memory</p>
            <p className="text-sm text-slate-600">
              Makes the stall owner remember the favourite order example.
            </p>
          </div>
          <input
            type="checkbox"
            className="h-6 w-6 accent-coral"
            checked={state.memoryEnabled}
            onChange={(event) =>
              setState((current) => ({ ...current, memoryEnabled: event.target.checked }))
            }
          />
        </label>
      </Card>

      <div className="space-y-6">
        <Card className="bg-white/95">
          <h3 className="text-xl font-semibold text-ink">Prototype menu</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li>Chicken Chop - $5.50</li>
            <li>Fish and Chips - $5.80</li>
            <li>Spaghetti - $4.80</li>
            <li>Customisations: no coleslaw, chilli on the side, extra fries</li>
          </ul>
        </Card>
        <Card className="bg-sand/95">
          <h3 className="text-xl font-semibold text-ink">Save changes</h3>
          <p className="mt-3 text-sm text-slate-600">
            This updates the single seeded scenario used by both caregiver and child demos.
          </p>
          <button
            onClick={handleSave}
            className="mt-5 w-full rounded-2xl bg-coral px-4 py-3 font-medium text-white"
          >
            Save scenario settings
          </button>
          {saved ? <p className="mt-3 text-sm font-medium text-emerald-700">Scenario updated.</p> : null}
          <Link className="mt-3 block text-sm font-medium text-coral" href="/caregiver/manage">
            Back to scenario dashboard
          </Link>
        </Card>
      </div>
    </div>
  );
}
