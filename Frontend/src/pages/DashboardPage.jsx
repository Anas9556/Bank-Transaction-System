import { useMemo } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import CashFlowChart from "../components/dashboard/CashFlowChart.jsx";
import EmptyState from "../components/dashboard/EmptyState.jsx";
import MyAccounts from "../components/dashboard/MyAccounts.jsx";
import RecentTransactions from "../components/dashboard/RecentTransactions.jsx";
import SummaryCard from "../components/dashboard/SummaryCard.jsx";
import WelcomeSection from "../components/dashboard/WelcomeSection.jsx";
import { filterTransactionsByRange, formatCurrencyTotals, formatMoney, transactionDirection } from "../services/ledger.js";

export default function DashboardPage() {
  const { user, accounts, transactions, refresh, selectedRange, setSelectedRange } = useOutletContext();
  const navigate = useNavigate();
  const visibleTransactions = useMemo(
    () => filterTransactionsByRange(transactions.data, selectedRange),
    [transactions.data, selectedRange]
  );
  const metrics = useMemo(() => {
    const totals = visibleTransactions.reduce((result, transaction) => {
      const amount = Number(transaction.amount) || 0;
      const direction = transactionDirection(transaction);
      if (direction === "credit") result.incoming += amount;
      if (direction === "debit") result.outgoing += amount;
      return result;
    }, { incoming: 0, outgoing: 0 });
    return totals;
  }, [visibleTransactions]);
  const chartData = useMemo(() => buildCashFlow(visibleTransactions), [visibleTransactions]);

  return (
    <main className="dashboard-content">
      {accounts.error || transactions.error ? (
        <div className="dashboard-warning error" role="alert">
          <span className="material-symbols-outlined" aria-hidden="true">error</span>
          <div>
            <strong>Some ledger data could not be loaded</strong>
            <span>{[accounts.error, transactions.error].filter(Boolean).join(" ")}</span>
          </div>
          <button className="text-button" type="button" onClick={refresh}>Retry</button>
        </div>
      ) : null}
      <WelcomeSection
        user={user}
        onAddTransaction={() => navigate("/transactions/new")}
      />

      <section className="summary-grid">
        <SummaryCard
          label="Total balance"
          subtitle="Across your accounts"
          value={accounts.available ? formatCurrencyTotals(accounts.data) : "Unavailable"}
          icon="account_balance_wallet"
          tone="positive"
          note={accounts.available ? `${accounts.data.length} account${accounts.data.length === 1 ? "" : "s"}` : "Account data unavailable"}
          unavailable={!accounts.available}
        />
        <SummaryCard
          label="Incoming transfers"
          subtitle={`In the last ${selectedRange}`}
          value={transactions.available ? formatMoney(metrics.incoming) : "Unavailable"}
          icon="south_west"
          tone="positive"
          note="External credits only"
          unavailable={!transactions.available}
        />
        <SummaryCard
          label="Outgoing transfers"
          subtitle={`In the last ${selectedRange}`}
          value={transactions.available ? formatMoney(metrics.outgoing) : "Unavailable"}
          icon="north_east"
          tone="negative"
          note="External debits only"
          unavailable={!transactions.available}
        />
        <SummaryCard
          label="Net movement"
          subtitle="Incoming less outgoing"
          value={transactions.available ? formatMoney(metrics.incoming - metrics.outgoing) : "Unavailable"}
          icon="monitoring"
          tone={metrics.incoming - metrics.outgoing >= 0 ? "positive" : "negative"}
          note="Internal transfers excluded"
          unavailable={!transactions.available}
        />
      </section>

      <section className="charts-grid">
        <CashFlowChart
          data={chartData}
          selectedRange={selectedRange}
          onRangeChange={setSelectedRange}
          unavailable={!transactions.available}
        />
        <section className="dashboard-card expense-card">
          <div className="card-title-row">
            <div>
              <h2>Transfer activity</h2>
              <p>External ledger movement in this period</p>
            </div>
          </div>
          {transactions.available && visibleTransactions.length ? (
            <div className="activity-summary">
              <div><span>Incoming</span><strong className="amount-positive">{formatMoney(metrics.incoming)}</strong></div>
              <div><span>Outgoing</span><strong className="amount-negative">{formatMoney(metrics.outgoing)}</strong></div>
              <div><span>Internal transfers</span><strong>{visibleTransactions.filter((item) => transactionDirection(item) === "internal").length}</strong></div>
            </div>
          ) : (
            <EmptyState
              compact
              icon="sync_alt"
              title={transactions.available ? "No activity in this period" : "Transfer data unavailable"}
              message={transactions.available ? "No transfers were recorded in the selected date range." : "The transaction feed could not be loaded."}
            />
          )}
          <div className="card-footnote"><span>Based on the latest 100 records returned by the API</span></div>
        </section>
      </section>

      <section className="lower-grid">
        <RecentTransactions
          transactions={visibleTransactions.slice(0, 5)}
          unavailable={!transactions.available}
          onNew={() => navigate("/transactions/new")}
        />
        <MyAccounts
          accounts={accounts.data}
          unavailable={!accounts.available}
          onCreateAccount={() => navigate("/accounts?new=1")}
          creatingAccount={false}
        />
      </section>
      <div className="dashboard-page-foot">
        <span>Transfers between your own accounts are excluded from cash-flow totals.</span>
        <Link to="/transactions">View all transactions</Link>
      </div>
    </main>
  );
}

function buildCashFlow(transactions) {
  const days = new Map();
  for (const transaction of transactions) {
    const direction = transactionDirection(transaction);
    if (direction !== "credit" && direction !== "debit") continue;
    const date = new Date(transaction.createdAt);
    if (Number.isNaN(date.getTime())) continue;
    const key = date.toISOString().slice(0, 10);
    const label = new Intl.DateTimeFormat("en-IN", { month: "short", day: "2-digit" }).format(date);
    const row = days.get(key) || { key, label, income: 0, expenses: 0 };
    row[direction === "credit" ? "income" : "expenses"] += Number(transaction.amount) || 0;
    days.set(key, row);
  }
  return Array.from(days.values()).sort((a, b) => a.key.localeCompare(b.key)).slice(-8);
}
