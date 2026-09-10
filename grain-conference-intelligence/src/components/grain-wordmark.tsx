export function GrainWordmark({ stacked = false }: { stacked?: boolean }) {
  return (
    <div className={stacked ? "wordmark wordmark-stack" : "wordmark"} aria-label="grain Conference Intelligence">
      <span className="wordmark-name">grain</span>
      <span className="wordmark-product">Conference Intelligence</span>
    </div>
  );
}
