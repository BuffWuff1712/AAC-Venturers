import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { api } from "@/api/client";

const ToggleRow = ({ title, enabled, onToggle, children }) => {
  return (
    <div className="rounded-[32px] border-b-8 border-gray-200 bg-white p-6 shadow-xl">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-black text-text-brown">{title}</h2>

        <button
          type="button"
          onClick={onToggle}
          className={`relative h-12 w-24 rounded-full transition-all ${
            enabled ? "bg-child-green" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute top-1.5 h-9 w-9 rounded-full bg-white shadow-md transition-all ${
              enabled ? "left-13" : "left-1.5"
            }`}
          />
        </button>
      </div>

      {enabled ? <div className="mt-6">{children}</div> : null}
    </div>
  );
};

const fallbackScenario = {
  scenario: {
    scenarioId: "scenario-001",
    title: "Canteen",
    isActive: true,
  },
  settings: {
    location_name: "Canteen",
    location_image_url: "/images/canteen.jpg",
    background_noise: 20,
    ai_personality_prompt:
      "You are a friendly student also queuing in the same line. Encourage the child gently and wait for their response.",
    contingencies:
      "If the child is silent for 10 seconds, prompt the child again. If the child is still silent for another 10 seconds, ask a follow-up clarification question.",
  },
  objectives: [
    {
      description: "Order food politely",
    },
    {
      description: "Ask for clarification if needed",
    },
    {
      description: "Find a seat independently",
    },
  ],
};

const FALLBACK_LOCATION_IMAGE = "/images/canteen.jpg";

function parseObjectivesInput(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*\d+\.\s*/, "").trim())
    .filter(Boolean);
}

function resolveScenarioImage(locationImage) {
  if (typeof locationImage !== "string") {
    return FALLBACK_LOCATION_IMAGE;
  }

  const normalizedImage = locationImage.trim();

  if (!normalizedImage || normalizedImage === "/images/western-stall.jpg") {
    return FALLBACK_LOCATION_IMAGE;
  }

  return normalizedImage;
}

const MainSettings = () => {
  const router = useRouter();
  const { scenarioId, scenarioTitle } = router.query;
  const [settings, setSettings] = useState({
    locationNameEnabled: true,
    locationImageEnabled: true,
    objectivesEnabled: true,
    backgroundNoiseEnabled: true,
    aiPersonalityEnabled: true,
    contingenciesEnabled: true,
  });
  const [formData, setFormData] = useState({
    locationName: "Canteen",
    locationImage: FALLBACK_LOCATION_IMAGE,
    objectives: "",
    backgroundNoise: 20,
    aiPersonality:
      "You are a friendly student also queuing in the same line. Encourage the child gently and wait for their response.",
    contingencies:
      "If the child is silent for 10 seconds, prompt the child again. If the child is still silent for another 10 seconds, ask a follow-up clarification question.",
  });
  const [saving, setSaving] = useState(false);
  const [loadedScenario, setLoadedScenario] = useState(fallbackScenario);

  useEffect(() => {
    if (!router.isReady) return;

    let isMounted = true;

    const loadScenario = async () => {
      if (!scenarioId) {
        setLoadedScenario(fallbackScenario);
        setFormData({
          locationName: fallbackScenario.settings.location_name,
          locationImage: resolveScenarioImage(fallbackScenario.settings.location_image_url),
          objectives: fallbackScenario.objectives
            .map((objective, index) => `${index + 1}. ${objective.description}`)
            .join("\n"),
          backgroundNoise: fallbackScenario.settings.background_noise,
          aiPersonality: fallbackScenario.settings.ai_personality_prompt,
          contingencies: fallbackScenario.settings.contingencies,
        });
        return;
      }

      try {
        const data = await api.getCaregiverScenario(scenarioId);
        if (!isMounted) return;

        const nextScenario = data || fallbackScenario;
        setLoadedScenario(nextScenario);
        setFormData({
          locationName: nextScenario.settings?.locationName || "Canteen",
          locationImage: resolveScenarioImage(nextScenario.settings?.locationImageUrl),
          objectives: Array.isArray(nextScenario.objectives)
            ? nextScenario.objectives
                .map(
                  (objective, index) =>
                    `${index + 1}. ${objective.description || ""}`
                )
                .join("\n")
            : "",
          backgroundNoise: Number(nextScenario.settings?.backgroundNoise ?? 20),
          aiPersonality: nextScenario.settings?.aiPersonalityPrompt || "",
          contingencies: nextScenario.settings?.contingencies || "",
        });
      } catch {
        if (!isMounted) return;
        setLoadedScenario(fallbackScenario);
      }
    };

    loadScenario();

    return () => {
      isMounted = false;
    };
  }, [router.isReady, scenarioId]);

  const pageTitle = useMemo(() => {
    if (typeof scenarioTitle === "string" && scenarioTitle.trim()) {
      return scenarioTitle;
    }

    return loadedScenario.scenario?.title || "Canteen";
  }, [loadedScenario.scenario?.title, scenarioTitle]);

  const handleToggle = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      if (scenarioId) {
        await api.updateCaregiverScenarioSettings(scenarioId, {
          locationName: formData.locationName,
          locationImageUrl: formData.locationImage,
          objectives: parseObjectivesInput(formData.objectives),
          backgroundNoise: Number(formData.backgroundNoise),
          aiPersonalityPrompt: formData.aiPersonality,
          contingencies: formData.contingencies,
        });
      }

      alert("Scenario main settings saved successfully!");
      router.push({
        pathname: "/ManageScenario",
      });
    } catch (err) {
      alert(err.message || "Unable to save scenario settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-page-peach p-6 font-fredoka">
      <button
        onClick={() =>
          router.push({
            pathname: "/ManageScenario",
          })
        }
        className="mb-8 flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-black text-text-brown shadow-[0_4px_0_#e5e7eb] transition-all hover:translate-y-[4px] hover:shadow-none active:scale-95"
      >
        <span className="text-2xl">←</span> Back
      </button>

      <div className="mx-auto mb-10 max-w-6xl text-center">
        <h1 className="mb-3 text-6xl font-black text-text-brown">
          Main Settings
        </h1>
        <p className="text-2xl font-bold text-text-brown opacity-70">
          Configure the main scenario settings for {pageTitle}
        </p>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8">
        <ToggleRow
          title="Location Name"
          enabled={settings.locationNameEnabled}
          onToggle={() => handleToggle("locationNameEnabled")}
        >
          <label className="mb-2 block text-lg font-bold text-text-brown">
            Enter location name
          </label>
          <input
            type="text"
            value={formData.locationName}
            onChange={(e) => handleChange("locationName", e.target.value)}
            placeholder="Enter scenario location"
            className="w-full rounded-2xl border-2 border-caregiver-peach p-4 text-lg focus:outline-none"
          />
        </ToggleRow>

        <ToggleRow
          title="Location Image"
          enabled={settings.locationImageEnabled}
          onToggle={() => handleToggle("locationImageEnabled")}
        >
          <label className="mb-2 block text-lg font-bold text-text-brown">
            Image path or URL
          </label>
          <input
            type="text"
            value={formData.locationImage}
            onChange={(e) => handleChange("locationImage", e.target.value)}
            placeholder="/images/canteen.jpg"
            className="mb-4 w-full rounded-2xl border-2 border-caregiver-peach p-4 text-lg focus:outline-none"
          />

          <div className="relative h-64 w-full overflow-hidden rounded-[28px] border-2 border-dashed border-caregiver-peach bg-white">
            {formData.locationImage ? (
              <Image
                src={formData.locationImage}
                alt="Location Preview"
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-lg font-bold text-gray-400">
                No image selected
              </div>
            )}
          </div>
        </ToggleRow>

        <ToggleRow
          title="Objectives"
          enabled={settings.objectivesEnabled}
          onToggle={() => handleToggle("objectivesEnabled")}
        >
          <label className="mb-2 block text-lg font-bold text-text-brown">
            Scenario objectives
          </label>
          <textarea
            rows={5}
            value={formData.objectives}
            onChange={(e) => handleChange("objectives", e.target.value)}
            placeholder="Enter objectives for this scenario"
            className="w-full rounded-2xl border-2 border-caregiver-peach p-4 text-lg focus:outline-none"
          />
        </ToggleRow>

        <ToggleRow
          title="Background Noise"
          enabled={settings.backgroundNoiseEnabled}
          onToggle={() => handleToggle("backgroundNoiseEnabled")}
        >
          <label className="mb-2 block text-lg font-bold text-text-brown">
            Select noise level
          </label>
          <select
            value={formData.backgroundNoise}
            onChange={(e) => handleChange("backgroundNoise", Number(e.target.value))}
            className="w-full rounded-2xl border-2 border-caregiver-peach p-4 text-lg focus:outline-none"
          >
            <option value={0}>No background noise</option>
            <option value={10}>Low ambient noise</option>
            <option value={20}>Medium crowd noise</option>
            <option value={30}>High crowd noise</option>
          </select>
        </ToggleRow>

        <ToggleRow
          title="AI Personality : Open Ended Prompt"
          enabled={settings.aiPersonalityEnabled}
          onToggle={() => handleToggle("aiPersonalityEnabled")}
        >
          <label className="mb-2 block text-lg font-bold text-text-brown">
            Define AI personality
          </label>
          <textarea
            rows={6}
            value={formData.aiPersonality}
            onChange={(e) => handleChange("aiPersonality", e.target.value)}
            placeholder="Describe how the AI should behave in this scenario"
            className="w-full rounded-2xl border-2 border-caregiver-peach p-4 text-lg focus:outline-none"
          />
        </ToggleRow>

        <ToggleRow
          title="Contingencies"
          enabled={settings.contingenciesEnabled}
          onToggle={() => handleToggle("contingenciesEnabled")}
        >
          <label className="mb-2 block text-lg font-bold text-text-brown">
            Add fallback rules or exception handling
          </label>
          <textarea
            rows={6}
            value={formData.contingencies}
            onChange={(e) => handleChange("contingencies", e.target.value)}
            placeholder="Define what should happen when unexpected situations occur"
            className="w-full rounded-2xl border-2 border-caregiver-peach p-4 text-lg focus:outline-none"
          />
        </ToggleRow>
      </div>

      <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-4 sm:flex-row sm:justify-end">
        <button
          onClick={() => router.push("/ManageScenario")}
          className="rounded-2xl bg-white px-8 py-4 text-xl font-black text-text-brown shadow-[0_5px_0_#d1d5db] transition-all hover:translate-y-[5px] hover:shadow-none"
        >
          Cancel
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-2xl bg-child-green px-8 py-4 text-xl font-black text-text-brown shadow-[0_5px_0_#92c45e] transition-all hover:translate-y-[5px] hover:shadow-none disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
};

export default MainSettings;
