import EmptyState from "./EmptyState.jsx";

export default function CashFlowChart({ data, selectedRange, onRangeChange, unavailable }) {
  const hasData = data.length > 0;
  const ranges = ["7D", "30D", "90D", "All"];

  return (
    <section className="dashboard-card cashflow-card">
      <div className="card-toolbar">
        <div>
          <div className="title-with-chip">
            <h2>Cash Flow</h2>
            <span>INR Ledger</span>
          </div>
          <p>Incoming vs outgoing external transfers</p>
        </div>
        <div className="chart-legend">
          <span><i className="income-dot" />Incoming</span>
          <span><i className="expense-dot" />Outgoing</span>
        </div>
        <div className="mini-tabs">
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

      {hasData ? <LineChart data={data} /> : (
        <EmptyState
          icon="monitoring"
          title={unavailable ? "Transfer history unavailable" : "No transfers in this period"}
          message={unavailable ? "The transaction list could not be loaded from the backend." : "No dated external transfers were returned for this date range."}
        />
      )}

      <div className="card-footnote">
        <span>Internal transfers excluded</span>
        <span>Latest 100 API records</span>
      </div>
    </section>
  );
}

function LineChart({ data }) {
  const width = 760;
  const height = 300;
  const pad = { top: 24, right: 20, bottom: 32, left: 52 };
  const max = Math.max(1, ...data.flatMap((item) => [item.income, item.expenses]));
  const xStep = data.length > 1 ? (width - pad.left - pad.right) / (data.length - 1) : 0;
  const y = (value) => pad.top + (height - pad.top - pad.bottom) * (1 - value / max);
  const x = (index) => pad.left + index * xStep;
  const incomePath = data.map((item, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(item.income)}`).join(" ");
  const expensePath = data.map((item, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(item.expenses)}`).join(" ");
  const fillPath = `${incomePath} L ${x(data.length - 1)} ${height - pad.bottom} L ${pad.left} ${height - pad.bottom} Z`;

  return (
    <div className="chart-frame">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Cash flow chart">
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const yy = y(max * tick);
          return (
            <g key={tick}>
              <line className="grid-line" x1={pad.left} x2={width - pad.right} y1={yy} y2={yy} />
              <text className="axis-label" x={12} y={yy + 4}>{formatCompact(max * tick)}</text>
            </g>
          );
        })}
        <path className="area-fill" d={fillPath} />
        <path className="income-line" d={incomePath} />
        <path className="expense-line" d={expensePath} />
        {data.map((item, index) => (
          <g key={`points-${item.key || item.label}`}>
            <circle className="income-point" cx={x(index)} cy={y(item.income)} r="5">
              <title>{`${item.label} incoming: ${formatAmount(item.income)}`}</title>
            </circle>
            <circle className="expense-point" cx={x(index)} cy={y(item.expenses)} r="5">
              <title>{`${item.label} outgoing: ${formatAmount(item.expenses)}`}</title>
            </circle>
          </g>
        ))}
        {data.map((item, index) => (
          <text key={item.key || item.label} className="x-label" x={x(index)} y={height - 8} textAnchor="middle">{item.label}</text>
        ))}
      </svg>
    </div>
  );
}

function formatAmount(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value) || 0);
}

function formatCompact(value) {
  if (value >= 100000) return `₹${Math.round(value / 100000)}L`;
  if (value >= 1000) return `₹${Math.round(value / 1000)}k`;
  return `₹${Math.round(value)}`;
}
