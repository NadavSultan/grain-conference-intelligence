export default function Home() {
  return (
    <section className="workspace-card" aria-labelledby="workspace-title">
      <div>
        <p className="eyebrow">Checkpoint 1 · Trusted foundation</p>
        <h1 id="workspace-title">Conference intelligence workspace</h1>
        <p className="lede">
          A versioned local workspace for sourced conference records, labelled demo
          evidence, and repeatable sales planning.
        </p>
      </div>
      <div className="status-panel">
        <span className="status-dot" aria-hidden="true" />
        <div>
          <strong>Demo workspace</strong>
          <p>Stored only in this browser under a schema-versioned key.</p>
        </div>
      </div>
    </section>
  );
}
