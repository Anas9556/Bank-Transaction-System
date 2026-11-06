export default function EmptyState({ icon = "database", title, message, compact = false }) {
  return (
    <div className={`dash-empty ${compact ? "compact" : ""}`}>
      <div className="empty-icon">
        <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
      </div>
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}
