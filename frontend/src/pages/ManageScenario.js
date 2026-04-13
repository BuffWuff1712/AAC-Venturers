import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { api, clearAuthSession } from "@/api/client";

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/api$/, "") ||
  "http://localhost:4000";

const fallbackScenarios = [
  {
    scenarioId: "scenario-001",
    title: "Canteen",
    locationName: "School Canteen",
    isActive: true,
    image: "/images/canteen.jpg",
    description: "Practice ordering noodles and finding seats.",
  },
];

const FALLBACK_LOCATION_IMAGE = "/images/canteen.jpg";

function resolveScenarioImage(scenario) {
  const rawImage =
    scenario?.locationImageUrl ||
    scenario?.imageUrl ||
    scenario?.settings?.location_image_url ||
    "";

  if (!rawImage || typeof rawImage !== "string") {
    return FALLBACK_LOCATION_IMAGE;
  }

  const normalizedImage = rawImage.trim();

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

const ManageScenario = () => {
  const router = useRouter();
  const [apiScenarios, setApiScenarios] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const loadScenarios = async () => {
      try {
        const data = await api.getCaregiverScenarios();
        if (!isMounted) return;

        setApiScenarios(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load scenarios:", error);
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
        title: scenario.title || "Untitled Scenario",
        locationName:
          scenario.locationName || scenario.title || "Unknown Location",
        isActive: Boolean(scenario.isActive),
        image: resolveScenarioImage(scenario),
        description:
          scenario.description ||
          "Practice ordering noodles and finding seats.",
      }));
    }

    return fallbackScenarios;
  }, [apiScenarios]);

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-page-peach p-6 font-fredoka">
      <button
        onClick={() => {
          clearAuthSession();
          router.push("/");
        }}
        className="absolute top-6 left-6 flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-black text-text-brown shadow-[0_4px_0_#e5e7eb] transition-all hover:translate-y-[4px] hover:shadow-none active:scale-95"
      >
        <span className="text-2xl">←</span> Logout
      </button>

      <div className="mt-12 mb-12 text-center">
        <h1 className="mb-2 text-6xl font-black text-text-brown drop-shadow-sm">
          Manage Scenarios
        </h1>
        <p className="text-2xl font-bold text-text-brown opacity-70">
          Edit and Track Progress
        </p>
      </div>

      <div className="mb-8 flex w-full max-w-6xl justify-end">
        <button
          onClick={() =>
            router.push({
              pathname: "/MainSettings",
              query: {
                mode: "add",
              },
            })
          }
          className="flex items-center justify-center gap-2 rounded-2xl bg-child-green px-6 py-4 text-xl font-black text-text-brown shadow-[0_5px_0_#92c45e] transition-all hover:bg-[#b9e67a] active:translate-y-[5px] active:shadow-none"
        >
          <span className="text-2xl">＋</span> Add Scenario
        </button>
      </div>

      <div className="grid w-full max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {scenarios.map((scenario) => (
          <div
            key={scenario.scenarioId}
            className="rounded-[40px] border-b-8 border-gray-200 bg-white p-6 shadow-xl"
          >
            <div className="relative mb-6 h-40 w-full overflow-hidden rounded-[30px] bg-page-peach">
              <Image
                src={scenario.image}
                alt={scenario.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            <div className="text-center">
              <h2 className="mb-4 text-3xl font-black text-text-brown">
                {scenario.title}
              </h2>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() =>
                    router.push({
                      pathname: "/MainSettings",
                      query: {
                        mode: "edit",
                        scenarioId: scenario.scenarioId,
                        scenarioTitle: scenario.title,
                      },
                    })
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-caregiver-peach py-4 text-xl font-black text-text-brown shadow-[0_5px_0_#e6b181] transition-all hover:bg-[#ffc891] active:translate-y-[5px] active:shadow-none"
                >
                  <span>✏️</span> Edit Scenario
                </button>

                <button
                  onClick={() =>
                    router.push({
                      pathname: "/History",
                      query: {
                        scenarioId: scenario.scenarioId,
                        scenarioTitle: scenario.title,
                      },
                    })
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-child-green py-4 text-xl font-black text-text-brown shadow-[0_5px_0_#92c45e] transition-all hover:bg-[#b9e67a] active:translate-y-[5px] active:shadow-none"
                >
                  <span>🕒</span> View History
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageScenario;
