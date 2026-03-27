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

  const { summary, history } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Avg response time"
          value={`${summary.averageResponseTime} ms`}
          hint="Across stored practice sessions"
        />
        <StatCard label="Hints used" value={summary.totalHintsUsed} hint="Helps you gauge support needs" />
        <StatCard
          label="Clarifications"
          value={summary.totalClarifications}
          hint="Counts when the child needed to retry"
        />
        <StatCard
          label="Success status"
          value={
            summary.totalSessions
              ? `${Math.round((summary.completedSessions / summary.totalSessions) * 100)}%`
              : "0%"
          }
          hint={`${summary.completedSessions}/${summary.totalSessions} sessions reached checkout`}
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
              {history.map((session) => (
                <tr key={session.id} className="border-b border-slate-100">
                  <td className="py-4 pr-4 font-medium text-ink">{session.childName}</td>
                  <td className="py-4 pr-4">
                    {session.objectiveCompleted ? "Completed" : "In progress"}
                  </td>
                  <td className="py-4 pr-4">{session.selectedItem || "Not chosen yet"}</td>
                  <td className="py-4 pr-4">{session.hintsUsed}</td>
                  <td className="py-4 pr-4">{session.clarificationCount}</td>
                  <td className="py-4 pr-4">{session.objectiveCompleted ? "Success" : "Pending"}</td>
                  <td className="py-4">{Math.round(session.averageResponseTime || 0)} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
