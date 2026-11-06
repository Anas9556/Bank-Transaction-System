export default function SummaryCard({ label, subtitle, value, icon, tone = "neutral", note, unavailable }) {
  return (
    <article className={`summary-card ${tone}`}>
      <div className="summary-top">
        <div>
          <span>{label}</span>
          <p>{subtitle}</p>
        </div>
        <div className="summary-icon">
          <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
        </div>
      </div>
      <div className="summary-value-row">
        <strong className={unavailable ? "muted-value" : ""}>{value}</strong>
      </div>
      <div className="summary-note">
        {note ? <span>{note}</span> : <span>Backend summary data unavailable</span>}
      </div>
    </article>
  );
}
