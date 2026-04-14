import { useMemo } from "react";
import { useRouter } from "next/router";
import { mockChildrenAchievements } from "@/data/mockAchievements";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function rankChildren(children) {
  // Ranking rule:
  // 1) Higher level first.
  // 2) If level is tied, higher XP first.
  // 3) If both tie, sort by name for stable order.
  return [...children].sort((a, b) => {
    if (b.level !== a.level) return b.level - a.level;
    if (b.xp !== a.xp) return b.xp - a.xp;
    return a.name.localeCompare(b.name);
  });
}

function initialsFromName(name = "") {
  const pieces = String(name).trim().split(/\s+/).filter(Boolean);
  return pieces.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "NA";
}

export default function AchievementRankingsPage() {
  const router = useRouter();

  const rankedChildren = useMemo(
    () => rankChildren(mockChildrenAchievements),
    [],
  );

  return (
    <div className="min-h-screen bg-page-peach p-6 font-fredoka">
      <div className="mx-auto w-full max-w-6xl">
        <Button
          variant="outline"
          onClick={() => router.push("/ManageScenario")}
          className="mb-6"
        >
          <span className="text-2xl">←</span> Back
        </Button>

        <Card className="mb-8 rounded-[34px] border-b-8 border-[#f0c89c]">
          <CardContent className="p-8">
            <div className="flex items-center justify-center gap-3">
              <h1 className="text-center text-5xl font-black text-text-brown">
                🏆 Achievement Rankings
              </h1>
            </div>
            <p className="mt-2 text-center text-xl font-bold text-text-brown/70">
              See how children are progressing in their learning journey
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {rankedChildren.map((child, index) => (
            <Card
              key={child.childId}
              className="cursor-pointer rounded-[28px] transition-all hover:-translate-y-1 hover:border-b-8 hover:border-child-green"
              onClick={() => router.push(`/achievements/${child.childId}`)}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-caregiver-peach text-2xl font-black text-text-brown">
                      {initialsFromName(child.name)}
                    </div>

                    <div>
                      <p className="text-3xl font-black text-text-brown">
                        {child.name}
                        <span className="ml-3 text-2xl font-bold text-text-brown/75">
                          Age {child.age}
                        </span>
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge variant="default">Level {child.level} Speaker</Badge>
                        <Badge variant="secondary">{child.xp} XP</Badge>
                        <Badge variant="outline">
                          {child.badgesUnlocked}/{child.badgesTotal} badges
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant="secondary"
                    className="h-12 w-12 justify-center rounded-full text-2xl"
                  >
                    #{index + 1}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
