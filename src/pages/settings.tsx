// ─── SettingsPage ────────────────────────────────────────────────────────────
// Full settings screen.  Persists to localStorage so settings survive page refreshes.
//   • Volume slider
//   • Background noise level (Low / Medium / High)
//   • Character personality pair sliders (Shy ↔ Energetic, etc.)
//   • Return to Home button

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { AppSettings, PersonalityPair } from "../types/scenario";

// ── Default settings ──────────────────────────────────────────────────────────
const DEFAULT_PERSONALITY: PersonalityPair[] = [
  { key: "energy",   left: "Shy",      right: "Energetic", value: "left" },
  { key: "patience", left: "Friendly", right: "Impatient", value: "left" },
  { key: "gender",   left: "Boy",      right: "Girl",       value: "left" },
];

const DEFAULT_SETTINGS: AppSettings = {
  volume: 80,
  backgroundNoise: "low",
  personality: DEFAULT_PERSONALITY,
};

const STORAGE_KEY = "aacventure_settings";

// ── Helper: load / save settings via localStorage ─────────────────────────────
const loadSettings = (): AppSettings => {   // (): AppSettings is the RETURN type annotation
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const saveSettings = (s: AppSettings) => {   // s: AppSettings is the PARAMETER type annotation
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
};

// ── Component ─────────────────────────────────────────────────────────────────
const SettingsPage: React.FC = () => {
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  // Generic setter that also persists immediately
  const update = (patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  };

  // Update a single personality slider by key
  const updatePersonality = (key: string, value: "left" | "right") => {
    const updated = settings.personality.map((p) =>
      p.key === key ? { ...p, value } : p
    );
    update({ personality: updated });
  };

  // Reset to default button that clears cache and removes the storage key
  const resetToDefault = () => {
    localStorage.removeItem(STORAGE_KEY); // Replace "appSettings" with the actual storage key if different
    window.location.reload(); // Reload the page to reset the state
  };

  return (
    <div className="min-h-screen bg-page-peach font-fredoka p-8 flex flex-col gap-8 max-w-2xl mx-auto">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="relative flex items-center justify-center">
        <button
          onClick={() => router.push("/")}
          className="absolute left-0 bg-white px-5 py-2.5 rounded-2xl font-black text-text-brown shadow-[0_4px_0_#e5e7eb] hover:shadow-none hover:translate-y-1 active:scale-95 transition-all"
        >
          ← 🏠 Return to Home
        </button>
        <h1 className="text-4xl text-center font-black text-text-brown">Settings</h1>
      </div>

      {/* ── Main Settings Card ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl shadow-lg p-6 space-y-6">
        <h2 className="text-2xl font-black text-text-brown">Main Settings</h2>

        {/* Volume */}
        <div className="space-y-2">
          <label className="flex justify-between font-bold text-gray-700">
            <span>🔊 Volume</span>
            <span className="text-purple-600">{settings.volume}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.volume}
            onChange={(e) => update({ volume: Number(e.target.value) })}
            className="w-full accent-purple-500 h-3 rounded-full cursor-pointer"
          />
        </div>
      </div>

      {/* ── Detailed Settings Card ───────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl shadow-lg p-6 space-y-6">
        <h2 className="text-2xl font-black text-text-brown">Detailed Settings</h2>

        {/* Background noise level */}
        <div className="space-y-3">
          <p className="font-bold text-gray-700">🎙 Background Noise Level</p>
          <div className="flex gap-3">
            {(["low", "medium", "high"] as const).map((level) => (
              <button
                key={level}
                onClick={() => update({ backgroundNoise: level })}
                className={`
                  flex-1 py-3 rounded-2xl font-black text-lg capitalize transition-all
                  ${settings.backgroundNoise === level
                    ? "bg-purple-500 text-white shadow-[0_4px_0_#7c3aed] translate-y-0"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"}
                `}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Personality toggle switches */}
        <div className="space-y-3">
          <p className="font-bold text-gray-700">🎭 Character Personality</p>
          {settings.personality.map((pair) => (
            <div key={pair.key} className="space-y-1">
              {/* Labels */}
              <div className="flex justify-between text-lg font-extrabold text-gray-500">
                <span className={pair.value === "left" ? "text-purple-600" : ""}>{pair.left}</span>
                <span className={pair.value === "right" ? "text-purple-600" : ""}>{pair.right}</span>
              </div>
              {/* Toggle Switch */}
              <div className="flex items-center justify-center">
                <button
                  onClick={() => updatePersonality(pair.key, pair.value === "left" ? "right" : "left")}
                  className={`w-16 h-8 flex items-center rounded-full p-1 transition-all ${
                    pair.value === "right" ? "bg-purple-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                      pair.value === "right" ? "translate-x-8" : "translate-x-0"
                    }`}
                  ></div>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reset to Default Button */}
      <button
        onClick={resetToDefault}
        style={{ marginTop: "2px" }}
        className="px-4 py-2 bg-red-500 text-white font-bold rounded hover:bg-red-600"
      >
        Reset to Default
      </button>
    </div>
  );
};

export default SettingsPage;
