import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui";
import { toDateInput } from "@/lib/utils";
import { ContentClient, type ContentRow } from "./ContentClient";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const items = await prisma.contentItem.findMany({
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  const rows: ContentRow[] = items.map((c) => ({
    id: c.id,
    title: c.title,
    platform: c.platform,
    format: c.format,
    status: c.status,
    owner: c.owner,
    dueDate: toDateInput(c.dueDate),
    publishDate: toDateInput(c.publishDate),
    hook: c.hook,
    thumbnailIdea: c.thumbnailIdea,
    caption: c.caption,
    link: c.link,
    performanceNotes: c.performanceNotes,
  }));

  return (
    <div>
      <PageHeader title="Content" subtitle="Clips and posts from idea to published — keep the comedy brand warm." />
      <ContentClient items={rows} />
    </div>
  );
}
