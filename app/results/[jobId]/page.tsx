import { ResultsView } from "@/components/results/ResultsView";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  return <ResultsView jobId={jobId} />;
}
