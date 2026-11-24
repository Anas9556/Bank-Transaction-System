import EmptyState from "./EmptyState.jsx";

export default function CashFlowChart({ data, direction, unavailable }) {
  const incoming = direction === "incoming";
  const title = incoming ? "Incoming by transfer type" : "Expenditures by transfer type";
  const categories = incoming ? data.incomingCategories : data.outgoingCategories;
  const max = Math.max(1, ...categories.flatMap((row) => [row.current, row.previous]));

  return (
    <section className="dashboard-card cashflow-card category-comparison-card">
      <div className="card-toolbar">
        <div>
          <div className="title-with-chip">
            <h2>{title}</h2>
            <span>By category</span>
          </div>
          <p>{data.currentLabel} (days 1–{data.currentCutoffDay}) vs {data.previousLabel} (days 1–{data.previousCutoffDay})</p>
        </div>
        <div className="chart-legend category-comparison-legend" aria-label="Month legend">
          <span><i className="month-current-dot" />This month</span>
          <span><i className="month-previous-dot" />Previous month</span>
        </div>
      </div>

      {categories.length ? (
        <div className="category-comparison-list" role="list" aria-label={title}>
          {categories.map((row) => (
            <div className="category-comparison-row" key={row.category} role="listitem">
              <span className="category-comparison-label">{row.category}</span>
              <div
                className="category-comparison-bars"
                role="img"
                aria-label={`${row.category}: this month ${formatAmount(row.current)}, previous month ${formatAmount(row.previous)}`}
              >
                <div className="category-comparison-bar-line">
                  <div className="category-comparison-track">
                    <span
                      className="category-bar-fill month-current-bar"
                      style={{ width: `${(row.current / max) * 100}%` }}
                      title={`This month: ${formatAmount(row.current)}`}
                    />
                  </div>
                  <span className="category-comparison-value">{formatAmount(row.current)}</span>
                </div>
                <div className="category-comparison-bar-line">
                  <div className="category-comparison-track">
                    <span
                      className="category-bar-fill month-previous-bar"
                      style={{ width: `${(row.previous / max) * 100}%` }}
                      title={`Previous month: ${formatAmount(row.previous)}`}
                    />
                  </div>
                  <span className="category-comparison-value">{formatAmount(row.previous)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          compact
          icon="monitoring"
          title={unavailable ? "Transfer history unavailable" : `No ${incoming ? "incoming" : "expenditure"} categories to compare`}
          message={unavailable
            ? "The transaction list could not be loaded from the backend."
            : "No completed external transfers were recorded in either comparison period."}
        />
      )}

      <div className="card-footnote">
        <span>Compare the two bars on each category row</span>
        <span>Internal transfers excluded · Latest 100 records</span>
      </div>
    </section>
  );
}

function formatAmount(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}
