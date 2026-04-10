import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { api, clearAuthSession } from "@/api/client";

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
        isActive: scenario.isActive,
        image: "/images/canteen.jpg",
        description: "Practice ordering noodles and finding seats.",
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
