import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { api } from "@/api/client";

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/api$/, "") ||
  "http://localhost:4000";

const fallbackScenarios = [
  {
    scenarioId: "scenario-001",
    title: "Canteen",
    locationName: "School Canteen",
    locationImage: "/images/canteen.jpg",
    description: "Learn how to greet a friend and start a conversation!",
  },
];

const FALLBACK_LOCATION_IMAGE = "/images/canteen.jpg";

function resolveScenarioImage(locationImage) {
  if (typeof locationImage !== "string") {
    return FALLBACK_LOCATION_IMAGE;
  }

  const normalizedImage = locationImage.trim();

  if (!normalizedImage || normalizedImage === "/images/western-stall.jpg") {
    return FALLBACK_LOCATION_IMAGE;
  }

  if (
    normalizedImage.startsWith("http://") ||
    normalizedImage.startsWith("https://") ||
    normalizedImage.startsWith("blob:")
  ) {
    return normalizedImage;
  }

  if (normalizedImage.startsWith("/uploads/")) {
    return `${BACKEND_BASE}${normalizedImage}`;
  }

  return normalizedImage;
}

const ScenariosPage = () => {
  const router = useRouter();
  const [loadingScenarioId, setLoadingScenarioId] = useState("");
  const [apiScenarios, setApiScenarios] = useState([]);
  const [childName, setChildName] = useState("AAC-Venturer");

  useEffect(() => {
    let isMounted = true;

    const loadScenarios = async () => {
      try {
        const data = await api.getChildScenarios();
        if (!isMounted) return;

        setApiScenarios(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load child scenarios:", error);
        if (!isMounted) return;
        setApiScenarios([]);
      }
    };

    loadScenarios();

    const storedName = localStorage.getItem("childDisplayName");

    if (storedName && storedName.trim() !== "") {
      setChildName(storedName);
    }

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
        locationImage: resolveScenarioImage(
          scenario.locationImageUrl ||
            scenario.locationImage ||
            scenario.settings?.location_image_url ||
            scenario.settings?.locationImageUrl
        ),
        description:
          scenario.description ||
          scenario.scenarioDescription ||
          scenario.settings?.scenarioDescription ||
          scenario.settings?.scenario_description ||
          "Learn how to greet a friend and start a conversation!",
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
    <div className="min-h-screen bg-page-peach p-6 font-fredoka">
      <div className="mx-auto w-full max-w-6xl">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-black text-text-brown shadow-[0_4px_0_#e5e7eb] transition-all hover:translate-y-[4px] hover:shadow-none active:scale-95"
        >
          <span className="text-2xl">←</span> Back
        </button>

        {/*
          Top header hub:
          - Left side: XP progress bar and summary text.
          - Right side: mascot and speech bubble.
          Keeping them in one shared layout container removes the "floating apart" look.
        */}
        <div className="mt-8 mb-10 grid grid-cols-1 gap-6 rounded-[34px] border-4 border-white bg-[#fff7f1] p-5 shadow-lg lg:grid-cols-[1fr_auto] items-center">
          <div className="rounded-[26px] border-4 border-white bg-white p-4 shadow-md">
            <p className="mb-2 text-lg font-black text-text-brown">Level : 8</p>

            {/*
              The bar wrapper is relative so we can place centered XP text on top
              while still animating the green fill width underneath.
            */}
            <div className="relative w-full rounded-full border-2 border-[#dcebc8] bg-[#f3f8eb] p-2">
              <div
                className="h-12 rounded-full bg-child-green transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              >
                <div className="mt-1 ml-2 mr-2 h-2 w-full rounded-full bg-white/30" />
              </div>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-text-brown">
                XP: {currentXP} / {maxXP}
              </span>
            </div>

            <p className="mt-2 italic text-sm font-bold text-text-brown/70">
              Keep going, {childName}. {maxXP - currentXP} more XP to reach Level 9!
            </p>
          </div>

          <div className="relative flex flex-col items-center gap-0">
            {/* Speech Bubble */}
            <div className="max-w-[200px] transform transition-all duration-300 hover:-translate-y-1">
              <div className="rounded-[22px] bg-white p-4 shadow-xl border-4 border-caregiver-peach">
                <p className="font-fredoka text-text-brown text-center leading-tight">
                  <span className="text-sm font-black block">Hi {childName},</span>
                  <span className="text-sm font-black block">Time to level up!</span>
                </p>
              </div>
              {/* Tail pointing DOWN toward mascot */}
                <div className="flex justify-center -mb-1">
                <div className="h-0 w-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-caregiver-peach" />
              </div>
            </div>

            {/* Mascot */}
            <div className="relative h-30 w-30">
              <Image
                src="/images/mascot.png"
                alt="Guide"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>

        <h1 className="mb-12 text-center text-6xl font-black text-text-brown drop-shadow-sm">
          Scenarios
        </h1>

        <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((scenario) => (
            <div
              key={scenario.scenarioId}
              className="group relative rounded-[40px] border-b-8 border-gray-200 bg-white p-6 shadow-xl transition-all hover:-translate-y-2 hover:border-child-green"
            >
              <div className="absolute -top-4 -right-4 rotate-12 rounded-2xl border-4 border-white bg-yellow-400 px-4 py-2 font-black text-text-brown shadow-lg transition-transform group-hover:rotate-0">
                +50 XP
              </div>

              <div className="relative mb-6 h-30  w-full overflow-hidden rounded-[20px] bg-page-peach">
                <Image
                  src={scenario.locationImage}
                  alt={scenario.title}
                  fill
                  className="object-cover"
                  unoptimized
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
        </div>
      </div>
    </div>
  );
};

export default ScenariosPage;
