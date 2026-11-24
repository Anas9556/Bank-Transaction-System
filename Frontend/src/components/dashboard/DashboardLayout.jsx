import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import DashboardHeader from "./DashboardHeader.jsx";

const primaryNav = [
  ["space_dashboard", "Dashboard", "/dashboard"],
  ["wallet", "Accounts", "/accounts"],
  ["receipt_long", "Transactions", "/transactions"],
  ["sync_alt", "Transfers", "/transfers"],
  ["query_stats", "Reports & Analytics", "/reports"],
];

function NavLink({ icon, label, href, active, onNavigate }) {
  return (
    <Link
      className={`dash-nav-link ${active ? "active" : ""}`}
      to={href}
      onClick={onNavigate}
    >
      <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

export default function DashboardLayout({ children, user, selectedRange, onRangeChange }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const initials = (user?.name || user?.email || "AR")
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "AR";

  return (
    <div className={`dashboard-page ${mobileOpen ? "mobile-nav-open" : ""}`}>
      <aside className="dashboard-sidebar">
        <div className="sidebar-top">
          <div className="dash-brand-row">
            <div className="dash-brand-main">
              <div>
                <strong>Ledgerly</strong>
                <span>Financial ledger</span>
              </div>
            </div>
          </div>

          <nav className="dash-nav">
            {primaryNav.map(([icon, label, href]) => (
              <NavLink
                key={label}
                icon={icon}
                label={label}
                href={href}
                active={location.pathname === href || (href !== "/dashboard" && location.pathname.startsWith(`${href}/`))}
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
          </nav>

        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="avatar-wrap">
              <div className="avatar">{initials}</div>
              <span className="online-dot" />
            </div>
            <div className="sidebar-user-copy">
              <strong>{user?.name || "Ledgerly User"}</strong>
              <span>{user?.email || "Authenticated session"}</span>
            </div>
          </div>
        </div>
      </aside>

      {mobileOpen ? <button className="sidebar-backdrop" type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} /> : null}
      <div className="dashboard-shell">
        <DashboardHeader
          user={user}
          selectedRange={selectedRange}
          onRangeChange={onRangeChange}
          onMenuClick={() => setMobileOpen((open) => !open)}
        />
        {children}
      </div>
    </div>
  );
}
