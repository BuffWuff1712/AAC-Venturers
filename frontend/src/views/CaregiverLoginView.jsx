"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../api/client";
import { Card } from "../components/Card";

export function CaregiverLoginView() {
  const router = useRouter();
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await api.login({ password });
      router.push("/caregiver/manage");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
      <Card className="bg-white/95">
        <p className="text-sm uppercase tracking-[0.3em] text-coral">Caregiver Demo Access</p>
        <h2 className="mt-4 text-4xl font-semibold text-ink">
          Tune the stall owner before recess practice starts.
        </h2>
        <p className="mt-4 max-w-lg text-slate-600">
          Configure one canteen scenario, switch personality traits, and review lightweight
          session analytics for a hackathon demo.
        </p>
      </Card>

      <Card className="bg-white/95">
        <h3 className="text-2xl font-semibold text-ink">Login</h3>
        <p className="mt-2 text-sm text-slate-500">
          Use the demo password to jump straight into the caregiver controls.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Demo password</span>
            <input
              type="password"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-coral transition focus:ring-2"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <button className="w-full rounded-2xl bg-coral px-4 py-3 font-medium text-white transition hover:opacity-95">
            Continue
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-500">
          Want to test the learner flow instead?{" "}
          <Link className="font-medium text-coral" href="/child/select">
            Open child practice
          </Link>
        </p>
      </Card>
    </div>
  );
}
