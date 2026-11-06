export default function EmptyPanel({ icon = "database", title, children, action }) {
  return (
    <div className="workspace-empty">
      <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
      <h2>{title}</h2>
      {children ? <p>{children}</p> : null}
      {action}
    </div>
  );
}
