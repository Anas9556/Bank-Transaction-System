import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ranges = ["7D", "30D", "90D", "All"];

const titleByPath = [
  ["/dashboard", "Dashboard"],
  ["/accounts", "Accounts"],
  ["/transactions", "Transactions"],
  ["/transfers", "Transfers"],
  ["/reports", "Reports & Analytics"],
];

export default function DashboardHeader({ user, selectedRange, onRangeChange, onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const pageTitle = titleByPath.find(([path]) => location.pathname.startsWith(path))?.[1] || "Workspace";

  return (
    <header className="dashboard-header">
      <button className="mobile-menu-button icon-button" type="button" aria-label="Open navigation" onClick={onMenuClick}>
        <span className="material-symbols-outlined" aria-hidden="true">menu</span>
      </button>
      <div className="breadcrumb">
        <span>Workspace</span>
        <span>/</span>
        <strong>{pageTitle}</strong>
      </div>
      <div className="header-actions">
        <form
          className="dash-search"
          onSubmit={(event) => {
            event.preventDefault();
            navigate(`/transactions${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
          }}
        >
          <span className="material-symbols-outlined" aria-hidden="true">search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search transactions and accounts..."
            aria-label="Search transactions and accounts"
          />
        </form>
        <div className="range-tabs" aria-label="Date range">
          {ranges.map((range) => (
            <button
              key={range}
              className={selectedRange === range ? "active" : ""}
              type="button"
              onClick={() => onRangeChange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
