import { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";

const ToggleRow = ({ title, enabled, onToggle, children }) => {
  return (
    <div className="rounded-[32px] bg-white p-6 shadow-xl border-b-8 border-gray-200">
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

      {enabled && <div className="mt-6">{children}</div>}
    </div>
  );
};

const MainSettings = () => {
  const router = useRouter();

  const [settings, setSettings] = useState({
    locationNameEnabled: true,
    locationImageEnabled: true,
    objectivesEnabled: true,
    backgroundNoiseEnabled: false,
    aiPersonalityEnabled: true,
    contingenciesEnabled: false,
  });

  const [formData, setFormData] = useState({
    locationName: "Canteen",
    locationImage:
      "/images/canteen.jpg",
    objectives:
      "1. Order food politely\n2. Ask for clarification if needed\n3. Find a seat independently",
    backgroundNoise: "Medium crowd noise",
    aiPersonality:
      "You are a friendly student also queuing in the same line. Encourage the child gently and wait for their response.",
    contingencies:
      "If the child is silent for 10 seconds, prompt the child again. If the child is still silent for another 10 seconds, ask a follow-up clarification question.",
  });

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

  const handleSave = () => {
    console.log("Saved settings:", { settings, formData });
    alert("Scenario main settings saved successfully!");
    router.push("/ManageScenario");
  };

  return (
    <div className="min-h-screen bg-page-peach p-6 font-fredoka">
      {/* Back Button */}
      <button
        onClick={() => router.push("/ManageScenario")}
        className="mb-8 flex items-center gap-2 bg-white px-6 py-3 rounded-2xl font-black text-text-brown shadow-[0_4px_0_#e5e7eb] hover:shadow-none hover:translate-y-[4px] active:scale-95 transition-all"
      >
        <span className="text-2xl">←</span> Back
      </button>

      {/* Header */}
      <div className="mx-auto max-w-6xl text-center mb-10">
        <h1 className="text-6xl font-black text-text-brown mb-3">
          Main Settings
        </h1>
        <p className="text-2xl font-bold opacity-70 text-text-brown">
          Configure the main scenario settings
        </p>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8">
        {/* Location Name */}
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

        {/* Location Image */}
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

          <div className="relative h-64 w-full overflow-hidden rounded-[28px] bg-white border-2 border-dashed border-caregiver-peach">
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

        {/* Objectives */}
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

        {/* Background Noise */}
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
            onChange={(e) => handleChange("backgroundNoise", e.target.value)}
            className="w-full rounded-2xl border-2 border-caregiver-peach p-4 text-lg focus:outline-none"
          >
            <option value="No background noise">No background noise</option>
            <option value="Low ambient noise">Low ambient noise</option>
            <option value="Medium crowd noise">Medium crowd noise</option>
            <option value="High crowd noise">High crowd noise</option>
          </select>
        </ToggleRow>

        {/* AI Personality */}
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

        {/* Contingencies */}
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

      {/* Action Buttons */}
      <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-4 sm:flex-row sm:justify-end">
        <button
          onClick={() => router.push("/ManageScenario")}
          className="bg-white px-8 py-4 rounded-2xl text-xl font-black text-text-brown shadow-[0_5px_0_#d1d5db] hover:shadow-none hover:translate-y-[5px] transition-all"
        >
          Cancel
        </button>

        <button
          onClick={handleSave}
          className="bg-child-green px-8 py-4 rounded-2xl text-xl font-black text-text-brown shadow-[0_5px_0_#92c45e] hover:shadow-none hover:translate-y-[5px] transition-all"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default MainSettings;