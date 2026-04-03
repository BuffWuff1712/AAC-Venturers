// ─── pages/scenarios.tsx ─────────────────────────────────────────────────────
// Scenario selection screen.  Clicking "Start Adventure" on the Canteen card
// navigates to the canteen scenario page.
// A Settings button in the top-right opens the settings page.

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";

const ScenariosPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false); // Fixed your bug here @linmyat

  // Mock XP progress bar data
  const currentXP = 450;
  const maxXP = 1000;
  const progress = (currentXP / maxXP) * 100;

  return (
    <div className="flex min-h-screen flex-col items-center bg-page-peach p-6 font-fredoka">

      {/* ── Back button (top-left) ──────────────────────────────────────────── */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-6 left-6 flex items-center gap-2 bg-white px-6 py-3 rounded-2xl font-black text-text-brown shadow-[0_4px_0_#e5e7eb] hover:shadow-none hover:translate-y-[4px] active:scale-95 transition-all"
      >
        <span className="text-2xl">←</span> Back
      </button>

      {/* ── Settings button (top-right) ─────────────────────────────────────── */}
      <button
        onClick={() => router.push("/settings")}
        className="absolute top-6 right-6 flex items-center gap-2 bg-white px-6 py-3 rounded-2xl font-black text-text-brown shadow-[0_4px_0_#e5e7eb] hover:shadow-none hover:translate-y-[4px] active:scale-95 transition-all"
      >
        ⚙️ Settings
      </button>

      {/* ── XP bar ─────────────────────────────────────────────────────────── */}
      <div className="w-full max-w-2xl bg-white rounded-full p-2 shadow-md border-4 border-white mb-10 mt-16 relative">
        <div
          className="h-8 bg-child-green rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        >
          <div className="w-full h-2 bg-white/30 rounded-full mt-1 ml-2 mr-2" />
        </div>
        <span className="absolute inset-0 flex items-center justify-center font-black text-text-brown">
          XP: {currentXP} / {maxXP}
        </span>
      </div>

      {/* ── Title ──────────────────────────────────────────────────────────── */}
      <h1 className="text-6xl font-black text-text-brown mb-12 drop-shadow-sm">
        Scenarios
      </h1>

      {/* ── Cards grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">

        {/* ── Canteen card ─────────────────────────────────────────────────── */}
        <div className="group relative bg-white rounded-[40px] p-6 shadow-xl border-b-8 border-gray-200 hover:border-child-green transition-all hover:-translate-y-2">

          {/* XP badge */}
          <div className="absolute -top-4 -right-4 bg-yellow-400 text-text-brown font-black px-4 py-2 rounded-2xl shadow-lg border-4 border-white rotate-12 group-hover:rotate-0 transition-transform">
            +50 XP
          </div>

          {/* Scenario image */}
          <div className="relative h-48 w-full rounded-[30px] overflow-hidden mb-6 bg-page-peach">
            <Image
              src="/images/canteen.jpg"
              alt="Canteen"
              fill
              className="object-cover"
            />
          </div>

          {/* Card content */}
          <div className="text-center">
            <h2 className="text-3xl font-black text-text-brown mb-2">Canteen</h2>
            <p className="text-lg font-medium text-gray-600 mb-4 leading-tight">
              Learn how to greet a friend and start a conversation!
            </p>

            {/* Step count pill */}
            <div className="inline-block bg-purple-100 text-purple-600 font-bold px-4 py-1 rounded-full text-sm mb-4">
              4 steps
            </div>

            {/* CTA button */}
            <button
              className="w-full bg-child-green hover:bg-green-400 text-text-brown font-black py-4 rounded-2xl text-2xl shadow-[0_6px_0_rgb(163,213,106)] active:shadow-none active:translate-y-[6px] transition-all disabled:opacity-60"
              onClick={() => router.push("/scenario/canteen")}
              disabled={loading}
            >
              {loading ? "Loading…" : "Start Adventure"}
            </button>
          </div>
        </div>

        {/* ── Placeholder for future scenarios ──────────────────────────────── */}
        {["Library", "Playground"].map((name) => (
          <div
            key={name}
            className="relative bg-white/60 rounded-[40px] p-6 shadow border-b-8 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3 min-h-[300px]"
          >
            <span className="text-5xl">🔒</span>
            <h2 className="text-2xl font-black text-gray-400">{name}</h2>
            <p className="text-sm text-gray-400 font-medium">Coming soon!</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScenariosPage;
