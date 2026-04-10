import { WorkspacePage } from "@/features/workspace";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project } = await searchParams;

  return <WorkspacePage requestedProjectId={project} />;
}
