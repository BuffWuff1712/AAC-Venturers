"use client";

import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Card } from "../components/Card";
import { StatCard } from "../components/StatCard";

export function CaregiverHistoryView() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.getAnalytics().then(setData);
  }, []);

  if (!data) {
    return <p className="text-sm text-slate-200">Loading analytics...</p>;
  }

  const { summary, recentSessions } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Avg response time"
          value={`${summary.averageResponseTime || 0} s`}
          hint="Across stored practice sessions"
        />
        <StatCard
          label="Sessions"
          value={summary.totalSessions || 0}
          hint="Completed and active practice runs"
        />
        <StatCard
          label="Success rate"
          value={`${Math.round((summary.averageSuccessRate || 0) * 100)}%`}
          hint="Average first-attempt success across recorded sessions"
        />
        <StatCard
          label="Completed"
          value={recentSessions.filter((session) => session.objectiveCompleted).length}
          hint="Sessions that reached checkout successfully"
        />
      </div>

      <Card className="bg-white/95">
        <h2 className="text-2xl font-semibold text-ink">Recent practice history</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-600">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 pr-4">Child</th>
                <th className="pb-3 pr-4">Result</th>
                <th className="pb-3 pr-4">Order</th>
                <th className="pb-3 pr-4">Hints</th>
                <th className="pb-3 pr-4">Clarifications</th>
                <th className="pb-3 pr-4">Success</th>
                <th className="pb-3">Avg response</th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.map((session) => (
                <tr key={session.sessionId} className="border-b border-slate-100">
                  <td className="py-4 pr-4 font-medium text-ink">{session.childName}</td>
                  <td className="py-4 pr-4">
                    {session.objectiveCompleted ? "Completed" : "In progress"}
                  </td>
                  <td className="py-4 pr-4">{session.selectedItem || "Not chosen yet"}</td>
                  <td className="py-4 pr-4">{session.hintsUsed}</td>
                  <td className="py-4 pr-4">{session.clarificationCount}</td>
                  <td className="py-4 pr-4">{session.objectiveCompleted ? "Success" : "Pending"}</td>
                  <td className="py-4">{Number(session.avgResponseTime || 0).toFixed(2)} s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
