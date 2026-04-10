import { Dashboard } from "@/components/dashboard";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project } = await searchParams;

  return <Dashboard requestedProjectId={project} />;
}
