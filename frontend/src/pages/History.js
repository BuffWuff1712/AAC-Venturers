import { useRouter } from "next/router";

const History = () => {
  const router = useRouter();

  // Mock session data
  const practiceSessions = [
    {
      id: 1,
      date: "3 Apr 2026",
      time: "10:15 AM",
      duration: "12 mins",
      result: "Completed",
    },
    {
      id: 2,
      date: "2 Apr 2026",
      time: "4:30 PM",
      duration: "9 mins",
      result: "Completed",
    },
    {
      id: 3,
      date: "1 Apr 2026",
      time: "2:00 PM",
      duration: "7 mins",
      result: "Incomplete",
    },
    {
      id: 4,
      date: "30 Mar 2026",
      time: "11:45 AM",
      duration: "15 mins",
      result: "Completed",
    },
  ];

  return (
    <div className="min-h-screen bg-page-peach p-6 font-fredoka">
      {/* Back Button */}
      <button
        onClick={() => router.push("/ManageScenario")}
        className="mb-8 flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-black text-text-brown shadow-[0_4px_0_#e5e7eb] transition-all hover:translate-y-[4px] hover:shadow-none active:scale-95"
      >
        <span className="text-2xl">←</span> Back
      </button>

      {/* Header */}
      <div className="mx-auto mb-10 max-w-6xl text-center">
        <h1 className="mb-3 text-6xl font-black text-text-brown">
          Scenario History
        </h1>
        <p className="text-2xl font-bold text-text-brown opacity-70">
          View all previous practice sessions for this scenario
        </p>
      </div>

      {/* Scenario Info */}
      <div className="mx-auto mb-8 max-w-6xl rounded-[36px] border-b-8 border-gray-200 bg-white p-6 shadow-xl">
        <h2 className="mb-2 text-3xl font-black text-text-brown">
          Canteen Scenario
        </h2>
        <p className="text-lg font-medium text-gray-600">
          Total Sessions: {practiceSessions.length}
        </p>
      </div>

      {/* Sessions List */}
      <div className="mx-auto max-w-6xl rounded-[36px] border-b-8 border-gray-200 bg-white p-6 shadow-xl">
        <h2 className="mb-6 text-3xl font-black text-text-brown">
          Previous Practice Sessions
        </h2>

        {practiceSessions.length === 0 ? (
          <div className="rounded-[28px] bg-page-peach p-10 text-center">
            <p className="text-2xl font-bold text-text-brown">
              No practice sessions found yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {practiceSessions.map((session) => (
              <div
                key={session.id}
                className="rounded-[28px] border-2 border-gray-100 bg-[#FFF9F5] p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  {/* Left: Session Info */}
                  <div>
                    <h3 className="text-2xl font-black text-text-brown">
                      Session #{session.id}
                    </h3>
                    <p className="mt-1 text-lg font-medium text-gray-600">
                      {session.date} • {session.time}
                    </p>
                  </div>

                  {/* Middle: Metrics */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:w-[40%]">
                    <div className="rounded-2xl bg-white px-4 py-3 text-center">
                      <p className="text-sm font-bold text-gray-500">
                        Duration
                      </p>
                      <p className="text-lg font-black text-text-brown">
                        {session.duration}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-3 text-center">
                      <p className="text-sm font-bold text-gray-500">
                        Result
                      </p>
                      <p
                        className={`text-lg font-black ${
                          session.result === "Completed"
                            ? "text-green-600"
                            : "text-orange-500"
                        }`}
                      >
                        {session.result}
                      </p>
                    </div>
                  </div>

                  {/* Right: Analytics Button */}
                  <button
                    onClick={() =>
                      router.push(`/Analytics?sessionId=${session.id}`)
                    }
                    className="rounded-2xl bg-child-green px-5 py-3 text-lg font-black text-text-brown shadow-[0_5px_0_#92c45e] transition-all hover:translate-y-[5px] hover:shadow-none"
                  >
                    View Analytics →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;