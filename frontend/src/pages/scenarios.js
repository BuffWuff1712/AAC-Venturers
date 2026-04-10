import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { api } from "@/api/client";

const fallbackScenarios = [
  {
    scenarioId: "scenario-001",
    title: "Canteen",
    locationName: "School Canteen",
    locationImage: "/images/canteen.jpg",
    description: "Learn how to greet a friend and start a conversation!",
  },
];

const lockedScenarioNames = ["Library", "Playground"];
const FALLBACK_LOCATION_IMAGE = "/images/canteen.jpg";

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

const ScenariosPage = () => {
  const router = useRouter();
  const [loadingScenarioId, setLoadingScenarioId] = useState("");
  const [apiScenarios, setApiScenarios] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadScenarios = async () => {
      try {
        const data = await api.getChildScenarios();
        if (!isMounted) return;

        setApiScenarios(Array.isArray(data) ? data : []);
      } catch {
        if (!isMounted) return;
        setApiScenarios([]);
      }
    };

    loadScenarios();

    return () => {
      isMounted = false;
    };
  }, []);

  const scenarios = useMemo(() => {
    if (apiScenarios.length > 0) {
      return apiScenarios.map((scenario) => ({
        scenarioId: scenario.scenarioId,
        title: scenario.title || "Canteen",
        locationName: scenario.locationName || scenario.title || "School Canteen",
        locationImage: resolveScenarioImage(scenario.locationImage),
        description: "Learn how to greet a friend and start a conversation!",
      }));
    }

    return fallbackScenarios;
  }, [apiScenarios]);

  const currentXP = 450;
  const maxXP = 1000;
  const progress = (currentXP / maxXP) * 100;

  const handleStartScenario = async (scenario) => {
    setLoadingScenarioId(scenario.scenarioId);

    await router.push({
      pathname: "/scenario/canteen",
      query: {
        scenarioId: scenario.scenarioId,
        scenarioTitle: scenario.title,
      },
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-page-peach p-6 font-fredoka">
      <button
        onClick={() => router.push("/")}
        className="absolute top-6 left-6 flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-black text-text-brown shadow-[0_4px_0_#e5e7eb] transition-all hover:translate-y-[4px] hover:shadow-none active:scale-95"
      >
        <span className="text-2xl">←</span> Back
      </button>

      <div className="relative mt-16 mb-10 w-full max-w-2xl rounded-full border-4 border-white bg-white p-2 shadow-md">
        <div
          className="h-8 rounded-full bg-child-green transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        >
          <div className="mt-1 ml-2 mr-2 h-2 w-full rounded-full bg-white/30" />
        </div>
        <span className="absolute inset-0 flex items-center justify-center font-black text-text-brown">
          XP: {currentXP} / {maxXP}
        </span>
      </div>

      <h1 className="mb-12 text-6xl font-black text-text-brown drop-shadow-sm">
        Scenarios
      </h1>

      <div className="grid w-full max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {scenarios.map((scenario) => (
          <div
            key={scenario.scenarioId}
            className="group relative rounded-[40px] border-b-8 border-gray-200 bg-white p-6 shadow-xl transition-all hover:-translate-y-2 hover:border-child-green"
          >
            <div className="absolute -top-4 -right-4 rotate-12 rounded-2xl border-4 border-white bg-yellow-400 px-4 py-2 font-black text-text-brown shadow-lg transition-transform group-hover:rotate-0">
              +50 XP
            </div>

            <div className="relative mb-6 h-48 w-full overflow-hidden rounded-[30px] bg-page-peach">
              <Image
                src={scenario.locationImage}
                alt={scenario.title}
                fill
                className="object-cover"
              />
            </div>

            <div className="text-center">
              <h2 className="mb-2 text-3xl font-black text-text-brown">
                {scenario.title}
              </h2>
              <p className="mb-4 text-lg font-medium leading-tight text-gray-600">
                {scenario.description}
              </p>

              <div className="mb-4 inline-block rounded-full bg-orange-100 px-4 py-1 text-sm font-bold text-text-brown">
                4 steps
              </div>

              <button
                className="w-full rounded-2xl bg-child-green py-4 text-2xl font-black text-text-brown shadow-[0_6px_0_rgb(163,213,106)] transition-all hover:bg-green-400 active:translate-y-[6px] active:shadow-none disabled:opacity-60"
                onClick={() => handleStartScenario(scenario)}
                disabled={loadingScenarioId === scenario.scenarioId}
              >
                {loadingScenarioId === scenario.scenarioId
                  ? "Loading..."
                  : "Start Adventure"}
              </button>
            </div>
          </div>
        ))}

        {lockedScenarioNames.map((name) => (
          <div
            key={name}
            className="relative flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-[40px] border-b-8 border-dashed border-gray-200 bg-white/60 p-6 shadow"
          >
            <span className="text-5xl">🔒</span>
            <h2 className="text-2xl font-black text-gray-400">{name}</h2>
            <p className="text-sm font-medium text-gray-400">Coming soon!</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScenariosPage;
