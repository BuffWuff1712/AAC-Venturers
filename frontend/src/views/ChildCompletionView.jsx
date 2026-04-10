"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "../components/Card";
import { useChildSession } from "../context/ChildSessionContext";

export function ChildCompletionView() {
  const params = useParams();
  const sessionId = params?.sessionId;
  const { sessionSnapshot } = useChildSession();
  const order = sessionSnapshot.orderSummary;

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="bg-white/95 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-coral">Mission Complete</p>
        <h2 className="mt-4 text-4xl font-semibold text-ink">Nice job ordering your food!</h2>
        <p className="mt-4 text-slate-600">
          Session #{sessionId} finished successfully. The child completed the canteen interaction and
          reached checkout.
        </p>
        <div className="mx-auto mt-8 max-w-md rounded-[28px] bg-sand p-6">
          <p className="text-sm font-medium text-slate-700">Order summary</p>
          <p className="mt-2 text-lg font-semibold text-ink">{order?.item || "Western stall order"}</p>
          <p className="mt-2 text-sm text-slate-600">
            {(order?.customizations || []).length
              ? order.customizations.join(", ")
              : "No customisations recorded"}
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">
            Status: {sessionSnapshot.state?.objectiveCompleted ? "Successful order" : "Practice logged"}
          </p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[24px] bg-slate-100 p-5">
            <p className="text-sm text-slate-500">XP earned</p>
            <p className="mt-2 text-3xl font-semibold text-ink">+120 XP</p>
          </div>
          <div className="rounded-[24px] bg-slate-100 p-5">
            <p className="text-sm text-slate-500">Badge</p>
            <p className="mt-2 text-3xl font-semibold text-ink">Lunch Legend</p>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link className="rounded-2xl bg-coral px-5 py-3 font-medium text-white" href="/child/select">
            Try again
          </Link>
          <Link
            className="rounded-2xl border border-slate-200 px-5 py-3 font-medium text-slate-700"
            href="/caregiver/history"
          >
            View analytics
          </Link>
        </div>
      </Card>
    </div>
  );
}
