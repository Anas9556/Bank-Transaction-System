export default function SummaryCard({ label, subtitle, value, tone = "neutral", note, unavailable }) {
  return (
    <article className={`summary-card ${tone}`}>
      <div className="summary-top">
        <div>
          <span>{label}</span>
          <p>{subtitle}</p>
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
