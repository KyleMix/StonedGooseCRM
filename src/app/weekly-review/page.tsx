import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { toDateInput } from "@/lib/utils";
import { WeeklyReviewClient, type ReviewRow } from "./WeeklyReviewClient";

export const dynamic = "force-dynamic";

// Monday of the current week (used as the default for a new review).
function mondayOfThisWeek(): string {
  const d = new Date();
  const day = d.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toDateInput(d);
}

export default async function WeeklyReviewPage() {
  const reviews = await prisma.weeklyReview.findMany({ orderBy: { weekOf: "desc" } });

  const rows: ReviewRow[] = reviews.map((r) => ({
    id: r.id,
    weekOf: toDateInput(r.weekOf),
    wins: r.wins,
    problems: r.problems,
    moneyStatus: r.moneyStatus,
    priorities: r.priorities,
    risks: r.risks,
    decisionsNeeded: r.decisionsNeeded,
  }));

  return (
    <div>
      <PageHeader title="Weekly Review" subtitle="One record per week — wins, problems, money, priorities, risks, decisions." />
      <WeeklyReviewClient reviews={rows} thisMonday={mondayOfThisWeek()} />
    </div>
  );
}
