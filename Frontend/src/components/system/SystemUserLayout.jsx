import "./system-user.css";
import { Link } from "react-router-dom";

export default function SystemUserLayout({ user, children }) {
  const initials = (user?.name || "System User")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="system-workspace">
      <aside className="system-rail">
        <Link className="system-brand" to="/system" aria-label="Ledgerly operations home">
          <span className="system-brand-mark"><span className="material-symbols-outlined" aria-hidden="true">account_balance</span></span>
          <span><strong>Ledgerly</strong><small>OPERATIONS</small></span>
        </Link>
        <div className="system-rail-label">CONTROL DESK</div>
        <div className="system-rail-item active"><span className="material-symbols-outlined" aria-hidden="true">south_west</span><span>Issue funds</span><span className="system-live-dot" /></div>
        <div className="system-rail-note"><span className="material-symbols-outlined" aria-hidden="true">verified_user</span><p>Privileged actions are validated and recorded by the ledger service.</p></div>
        <div className="system-operator">
          <span className="system-avatar">{initials || "SU"}</span>
          <span><strong>{user?.name || "System operator"}</strong><small>{user?.email}</small></span>
        </div>
      </aside>
      <main className="system-main">
        <header className="system-topbar">
          <div className="system-breadcrumb"><span>Ledgerly</span><span>/</span><strong>Funding operations</strong></div>
          <div className="system-environment"><span className="system-live-dot" />SYSTEM ACCOUNT</div>
        </header>
        {children}
      </main>
    </div>
  );
}
