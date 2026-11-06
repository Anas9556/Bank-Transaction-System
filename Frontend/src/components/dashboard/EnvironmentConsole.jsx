const modes = ["Normal State", "Loading State", "Empty Table", "API Failure", "Feed View"];

export default function EnvironmentConsole({ mode, onModeChange }) {
  if (!import.meta.env.DEV) return null;

  return (
    <section className="environment-console" aria-label="Development environment console">
      <div className="environment-label">
        <span className="status-dot" />
        <span>Environment Console: Institutional Ledger Alpha</span>
        <strong>DEV PREVIEW</strong>
      </div>
      <div className="environment-actions">
        {modes.map((item) => (
          <button
            key={item}
            className={mode === item ? "active" : ""}
            type="button"
            onClick={() => onModeChange(item)}
          >
            {item === "Feed View" ? <span className="material-symbols-outlined" aria-hidden="true">notifications</span> : null}
            {item}
          </button>
        ))}
      </div>
    </section>
  );
}
