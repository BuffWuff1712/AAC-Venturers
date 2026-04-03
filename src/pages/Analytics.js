import { useRouter } from "next/router";

const Analytics = () => {
  const router = useRouter();
  const { sessionId } = router.query;

  // Mock analytics data for now
  const sessionAnalyticsData = {
    1: {
      scenarioName: "Canteen",
      sessionLabel: "Session #1",
      date: "3 Apr 2026",
      time: "10:15 AM",
      averageResponseTime: "4.2 seconds",
      longestResponseQuestion: "What would you like to order today?",
      longestResponseTime: "8.1 seconds",
      shortestResponseQuestion: "Would you like a drink?",
      shortestResponseTime: "1.3 seconds",
      successRate: "4 / 5 (80%)",
      objectivesChecked: [
        "Ordered food politely",
        "Responded without repeated prompting",
        "Completed the conversation flow",
      ],
      audioRecorded: true,
      transcript: [
        { speaker: "AI", text: "Hello! What would you like to order today?" },
        { speaker: "Child", text: "I want noodles." },
        { speaker: "AI", text: "Sure! Would you like a drink?" },
        { speaker: "Child", text: "Yes, apple juice." },
        { speaker: "AI", text: "Okay, please wait at the side." },
        { speaker: "Child", text: "Okay." },
      ],
    },
    2: {
      scenarioName: "Canteen",
      sessionLabel: "Session #2",
      date: "2 Apr 2026",
      time: "4:30 PM",
      averageResponseTime: "5.0 seconds",
      longestResponseQuestion: "Where would you like to sit after ordering?",
      longestResponseTime: "9.4 seconds",
      shortestResponseQuestion: "Do you want noodles?",
      shortestResponseTime: "1.1 seconds",
      successRate: "3 / 5 (60%)",
      objectivesChecked: [
        "Ordered food politely",
        "Found seat with minimal support",
      ],
      audioRecorded: true,
      transcript: [
        { speaker: "AI", text: "Hi there! What would you like to eat?" },
        { speaker: "Child", text: "Noodles." },
        { speaker: "AI", text: "Where would you like to sit after ordering?" },
        { speaker: "Child", text: "There." },
      ],
    },
    3: {
      scenarioName: "Canteen",
      sessionLabel: "Session #3",
      date: "1 Apr 2026",
      time: "2:00 PM",
      averageResponseTime: "6.8 seconds",
      longestResponseQuestion: "Can you tell me what drink you want?",
      longestResponseTime: "11.2 seconds",
      shortestResponseQuestion: "Hello!",
      shortestResponseTime: "0.9 seconds",
      successRate: "2 / 5 (40%)",
      objectivesChecked: [
        "Participated in the scenario",
      ],
      audioRecorded: false,
      transcript: [],
    },
    4: {
      scenarioName: "Canteen",
      sessionLabel: "Session #4",
      date: "30 Mar 2026",
      time: "11:45 AM",
      averageResponseTime: "3.7 seconds",
      longestResponseQuestion: "What food would you like to buy?",
      longestResponseTime: "7.0 seconds",
      shortestResponseQuestion: "Thank you!",
      shortestResponseTime: "1.0 seconds",
      successRate: "5 / 5 (100%)",
      objectivesChecked: [
        "Ordered food politely",
        "Answered without prompts",
        "Found seat independently",
        "Completed full scenario successfully",
      ],
      audioRecorded: true,
      transcript: [
        { speaker: "AI", text: "What food would you like to buy?" },
        { speaker: "Child", text: "Chicken rice please." },
        { speaker: "AI", text: "Anything to drink?" },
        { speaker: "Child", text: "Water." },
        { speaker: "AI", text: "Thank you!" },
        { speaker: "Child", text: "Thank you." },
      ],
    },
  };

  const selectedSession =
    sessionAnalyticsData[sessionId] || sessionAnalyticsData[1];

  const handlePlayRecording = () => {
    alert("This will play the recorded conversation audio later.");
  };

  return (
    <div className="min-h-screen bg-page-peach p-6 font-fredoka">
      {/* Back Button */}
      <button
        onClick={() => router.push("/History")}
        className="mb-8 flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-black text-text-brown shadow-[0_4px_0_#e5e7eb] transition-all hover:translate-y-[4px] hover:shadow-none active:scale-95"
      >
        <span className="text-2xl">←</span> Back
      </button>

      {/* Header */}
      <div className="mx-auto mb-10 max-w-6xl text-center">
        <h1 className="mb-3 text-6xl font-black text-text-brown">
          Session Analytics
        </h1>
        <p className="text-2xl font-bold text-text-brown opacity-70">
          Review detailed performance for a selected practice session
        </p>
      </div>

      {/* Session Summary */}
      <div className="mx-auto mb-8 max-w-6xl rounded-[36px] border-b-8 border-gray-200 bg-white p-6 shadow-xl">
        <h2 className="text-3xl font-black text-text-brown">
          {selectedSession.scenarioName} Scenario
        </h2>
        <p className="mt-2 text-lg font-medium text-gray-600">
          {selectedSession.sessionLabel} • {selectedSession.date} • {selectedSession.time}
        </p>
      </div>

      {/* Main Analytics Grid */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-[32px] border-b-8 border-gray-200 bg-white p-6 shadow-xl">
          <h3 className="mb-3 text-2xl font-black text-text-brown">
            Average Response Time
          </h3>
          <p className="text-4xl font-black text-child-green">
            {selectedSession.averageResponseTime}
          </p>
        </div>

        <div className="rounded-[32px] border-b-8 border-gray-200 bg-white p-6 shadow-xl">
          <h3 className="mb-3 text-2xl font-black text-text-brown">
            Success Rate
          </h3>
          <p className="text-4xl font-black text-child-green">
            {selectedSession.successRate}
          </p>
          <p className="mt-3 text-sm font-medium text-gray-500">
            Number of questions answered first time without prompt from AI / Total number of questions asked by AI
          </p>
        </div>

        <div className="rounded-[32px] border-b-8 border-gray-200 bg-white p-6 shadow-xl">
          <h3 className="mb-3 text-2xl font-black text-text-brown">
            Question With Longest Response Time
          </h3>
          <p className="mb-3 text-xl font-bold text-text-brown">
            {selectedSession.longestResponseQuestion}
          </p>
          <div className="inline-block rounded-2xl bg-caregiver-peach px-4 py-2 text-lg font-black text-text-brown">
            {selectedSession.longestResponseTime}
          </div>
        </div>

        <div className="rounded-[32px] border-b-8 border-gray-200 bg-white p-6 shadow-xl">
          <h3 className="mb-3 text-2xl font-black text-text-brown">
            Question With Shortest Response Time
          </h3>
          <p className="mb-3 text-xl font-bold text-text-brown">
            {selectedSession.shortestResponseQuestion}
          </p>
          <div className="inline-block rounded-2xl bg-child-green px-4 py-2 text-lg font-black text-text-brown">
            {selectedSession.shortestResponseTime}
          </div>
        </div>
      </div>

      {/* Objectives Checked */}
      <div className="mx-auto mt-8 max-w-6xl rounded-[36px] border-b-8 border-gray-200 bg-white p-6 shadow-xl">
        <h2 className="mb-6 text-3xl font-black text-text-brown">
          Caregiver Checklist: Objectives Checked
        </h2>

        {selectedSession.objectivesChecked.length === 0 ? (
          <p className="text-lg font-medium text-gray-500">
            No objectives were checked for this session.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {selectedSession.objectivesChecked.map((objective, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-2xl bg-[#FFF9F5] px-5 py-4"
              >
                <span className="text-2xl">✅</span>
                <p className="text-lg font-bold text-text-brown">{objective}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recording + Transcript */}
      <div className="mx-auto mt-8 max-w-6xl rounded-[36px] border-b-8 border-gray-200 bg-white p-6 shadow-xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-3xl font-black text-text-brown">
            Conversation Recording
          </h2>

          <button
            onClick={handlePlayRecording}
            disabled={!selectedSession.audioRecorded}
            className={`rounded-2xl px-6 py-3 text-lg font-black transition-all ${
              selectedSession.audioRecorded
                ? "bg-caregiver-peach text-text-brown shadow-[0_5px_0_#e6b181] hover:translate-y-[5px] hover:shadow-none"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            ▶ Play Recording
          </button>
        </div>

        <h3 className="mb-4 text-2xl font-black text-text-brown">
          Transcript
        </h3>

        {selectedSession.transcript.length === 0 ? (
          <div className="rounded-[28px] bg-page-peach p-8 text-center">
            <p className="text-lg font-bold text-text-brown">
              No transcript available for this session yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {selectedSession.transcript.map((entry, index) => (
              <div
                key={index}
                className={`rounded-[24px] px-5 py-4 ${
                  entry.speaker === "AI"
                    ? "bg-caregiver-peach/50"
                    : "bg-child-green/50"
                }`}
              >
                <p className="mb-1 text-sm font-black uppercase text-gray-500">
                  {entry.speaker}
                </p>
                <p className="text-lg font-bold text-text-brown">
                  {entry.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;