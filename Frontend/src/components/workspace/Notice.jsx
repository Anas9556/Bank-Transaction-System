export default function Notice({ type = "info", title, children, action }) {
  return (
    <div className={`workspace-notice ${type}`} role={type === "error" ? "alert" : "status"}>
      <span className="material-symbols-outlined" aria-hidden="true">
        {type === "error" ? "error" : type === "success" ? "check_circle" : "info"}
      </span>
      <div><strong>{title}</strong><p>{children}</p></div>
      {action}
    </div>
  );
}
