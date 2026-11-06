import { Link } from "react-router-dom";

export default function PageHeader({ eyebrow = "Workspace", title, description, action }) {
  return (
    <header className="workspace-page-header">
      <div>
        <div className="page-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="page-header-action">{action}</div> : null}
    </header>
  );
}

export function PageAction({ to, onClick, icon = "add", children, disabled = false }) {
  const className = "primary-action";
  if (to) {
    return <Link className={className} to={to}><span className="material-symbols-outlined" aria-hidden="true">{icon}</span>{children}</Link>;
  }
  return (
    <button className={className} type="button" onClick={onClick} disabled={disabled}>
      <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>{children}
    </button>
  );
}
