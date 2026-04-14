import { useMemo } from "react";
import { useRouter } from "next/router";
import { mockChildrenAchievements } from "@/data/mockAchievements";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function initialsFromName(name = "") {
  const pieces = String(name).trim().split(/\s+/).filter(Boolean);
  return pieces.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "NA";
}

export default function ChildAchievementDetailsPage() {
  const router = useRouter();
  const { childId } = router.query;

  const child = useMemo(() => {
    if (typeof childId !== "string") return null;
    return mockChildrenAchievements.find((item) => item.childId === childId) || null;
  }, [childId]);

  if (!child) {
    return (
      <div className="min-h-screen bg-page-peach p-6 font-fredoka">
        <div className="mx-auto w-full max-w-5xl">
          <Button
            variant="outline"
            onClick={() => router.push("/achievements")}
            className="mb-6"
          >
            <span className="text-2xl">←</span> Back
          </Button>
          <Card className="rounded-[30px] border-b-8 border-[#f0c89c]">
            <CardContent className="p-8 text-center">
              <h1 className="text-4xl font-black text-text-brown">Child Not Found</h1>
              <p className="mt-2 text-lg font-bold text-text-brown/70">
                Select a child from the rankings to view achievements.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page-peach p-6 font-fredoka">
      <div className="mx-auto w-full max-w-6xl">
        <Button
          variant="outline"
          onClick={() => router.push("/achievements")}
          className="mb-6"
        >
          <span className="text-2xl">←</span> Back
        </Button>

        <Card className="mb-8 rounded-[34px] border-b-8 border-[#f0c89c]">
          <CardContent className="p-8">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-caregiver-peach text-3xl font-black text-text-brown">
                {initialsFromName(child.name)}
              </div>
              <div>
                <h1 className="text-5xl font-black text-text-brown">
                  {child.name}'s Achievements
                </h1>
                <p className="text-2xl font-bold text-text-brown/80">
                  Age {child.age} | Level {child.level} Speaker | {child.xp} XP
                </p>
                <p className="mt-1 text-xl font-black text-[#7f5a45]">
                  {child.badgesUnlocked} of {child.badgesTotal} achievements unlocked
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="mb-8">
          <h2 className="mb-4 text-3xl font-black text-text-brown">Badges</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {child.badges.length > 0 ? (
              child.badges.map((badge) => (
                <Card
                  key={badge.badgeId}
                  className={
                    badge.unlocked
                      ? "border-b-8 border-[#9acb67] bg-child-green"
                      : "border-b-8 border-[#dadada] bg-[#f4eeee]"
                  }
                >
                  <CardHeader className="pb-1">
                    <CardTitle>{badge.title}</CardTitle>
                    <CardDescription>{badge.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <Badge variant={badge.unlocked ? "success" : "muted"}>
                      {badge.unlocked ? "Unlocked" : "Locked"}
                    </Badge>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent>
                  <p className="text-lg font-bold text-text-brown/80">
                    No badge data yet for this child.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-3xl font-black text-text-brown">
            Scenario Completion History
          </h2>
          <div className="space-y-3">
            {child.scenarioHistory.length > 0 ? (
              child.scenarioHistory.map((session) => (
                <Card key={session.sessionId}>
                  <CardContent>
                    <p className="text-2xl font-black text-text-brown">
                      {session.scenarioTitle}
                    </p>
                    <p className="text-lg font-bold text-text-brown/80">
                      Completed: {session.completedAt} | +{session.xpEarned} XP | {session.durationMinutes} mins
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent>
                  <p className="text-lg font-bold text-text-brown/80">
                    No completed scenarios logged yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-3xl font-black text-text-brown">
            Recordings & Transcript History
          </h2>
          <div className="space-y-3">
            {child.recordings.length > 0 ? (
              child.recordings.map((recording) => (
                <Card key={recording.recordingId}>
                  <CardContent>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-2xl font-black text-text-brown">
                        {recording.scenarioTitle}
                      </p>
                      <Badge variant="default">Recorded {recording.recordedAt}</Badge>
                    </div>

                    {/* details gives a lightweight mock "expand transcript" interaction. */}
                    <details className="rounded-xl bg-page-peach p-3">
                      <summary className="cursor-pointer text-base font-black text-text-brown">
                        View Transcript
                      </summary>
                      <p className="mt-2 text-base font-medium leading-relaxed text-text-brown/90">
                        {recording.transcript}
                      </p>
                    </details>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent>
                  <p className="text-lg font-bold text-text-brown/80">
                    No recording transcripts available yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
