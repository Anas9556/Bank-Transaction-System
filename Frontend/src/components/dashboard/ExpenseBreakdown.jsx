import EmptyState from "./EmptyState.jsx";

const colors = ["#4fddb8", "#648aff", "#c8d3f0", "#8d98b4", "#555d73"];

export default function ExpenseBreakdown({ items, total, unavailable }) {
  const hasData = items.length > 0 && total > 0;

  return (
    <section className="dashboard-card expense-card">
      <div className="card-title-row">
        <div>
          <h2>Expense Breakdown</h2>
          <p>Spending across operational categories</p>
        </div>
        <button className="card-menu" type="button" aria-label="Expense options">
          <span className="material-symbols-outlined" aria-hidden="true">more_vert</span>
        </button>
      </div>

      {hasData ? (
        <>
          <div className="donut-wrap">
            <div className="donut" style={{ background: makeConic(items) }}>
              <div>
                <span>Total Spent</span>
                <strong>{formatCurrency(total)}</strong>
                <em>Selected</em>
              </div>
            </div>
          </div>
          <div className="breakdown-list">
            {items.map((item, index) => (
              <div key={item.label}>
                <span><i style={{ background: colors[index % colors.length] }} />{item.label}</span>
                <em>{item.percent}%</em>
                <strong>{formatCurrency(item.amount)}</strong>
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          compact
          icon="donut_large"
          title={unavailable ? "Breakdown unavailable" : "No categorized expenses"}
          message={unavailable ? "Transaction listing and category fields are not exposed by the backend." : "Categorized expense records were not found."}
        />
      )}

      <div className="card-footnote">
        <span>Category cap: unavailable</span>
        <span>Edit allocations →</span>
      </div>
    </section>
  );
}

function makeConic(items) {
  let start = 0;
  return `conic-gradient(${items.map((item, index) => {
    const end = start + item.percent;
    const segment = `${colors[index % colors.length]} ${start}% ${end}%`;
    start = end;
    return segment;
  }).join(", ")})`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}
