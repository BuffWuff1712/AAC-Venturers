"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Card } from "../components/Card";

export function CaregiverManageScenarioView() {
  const [scenario, setScenario] = useState(null);

  useEffect(() => {
    api.getScenario().then((data) => setScenario(data.scenario));
  }, []);

  if (!scenario) {
    return <p className="text-sm text-slate-200">Loading scenario...</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
      <Card className="space-y-5 bg-white/95">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-coral">Active Scenario</p>
            <h2 className="mt-3 text-3xl font-semibold text-ink">{scenario.name}</h2>
          </div>
          <span className="rounded-full bg-mint px-4 py-2 text-sm font-medium text-ink">
            Demo Ready
          </span>
        </div>
        <p className="text-slate-600">{scenario.description}</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-slate-100 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Personality</p>
            <p className="mt-2 text-lg font-semibold text-ink">{scenario.personality}</p>
          </div>
          <div className="rounded-3xl bg-slate-100 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Memory</p>
            <p className="mt-2 text-lg font-semibold text-ink">
              {scenario.memoryEnabled ? "Enabled" : "Disabled"}
            </p>
          </div>
          <div className="rounded-3xl bg-slate-100 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Objective</p>
            <p className="mt-2 text-sm font-medium text-ink">Complete one food order</p>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="bg-white/95">
          <h3 className="text-xl font-semibold text-ink">Next actions</h3>
          <div className="mt-5 space-y-3">
            <Link
              className="block rounded-2xl bg-coral px-4 py-3 text-center font-medium text-white"
              href="/caregiver/scenario"
            >
              Edit stall owner setup
            </Link>
            <Link
              className="block rounded-2xl bg-slate-900 px-4 py-3 text-center font-medium text-white"
              href="/caregiver/history"
            >
              View analytics and history
            </Link>
            <Link
              className="block rounded-2xl border border-slate-200 px-4 py-3 text-center font-medium text-slate-700"
              href="/child/select"
            >
              Preview child experience
            </Link>
          </div>
        </Card>
        <Card className="bg-sand/95">
          <h3 className="text-xl font-semibold text-ink">Demo access</h3>
          <p className="mt-3 text-sm text-slate-600">Password only: demo123</p>
          <p className="text-sm text-slate-600">
            Everything in this prototype runs from one seeded scenario.
          </p>
        </Card>
      </div>
    </div>
  );
}
