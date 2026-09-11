import Link from "next/link";

export function GrainWordmark({ stacked = false }: { stacked?: boolean }) {
  return (
    <Link
      href="/"
      className={stacked ? "wordmark wordmark-stack" : "wordmark"}
      aria-label="Grain Conference Intelligence — go to Today"
    >
      <span className="wordmark-name">grain</span>
      <span className="wordmark-product">Conference Intelligence</span>
    </Link>
  );
}
