import { useMemo } from "react";
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import EmptyPanel from "../components/workspace/EmptyPanel.jsx";
import Notice from "../components/workspace/Notice.jsx";
import PageHeader from "../components/workspace/PageHeader.jsx";
import { downloadCsv, filterTransactionsByRange, formatDate, formatMoney, transactionDirection } from "../services/ledger.js";

export default function Reports() {
  const { accounts, transactions, selectedRange } = useOutletContext();
  const [accountId, setAccountId] = useState("all");
  const periodTransactions = useMemo(
    () => filterTransactionsByRange(transactions.data, selectedRange)
      .filter((transaction) => accountId === "all"
        || transaction.accountId === accountId
        || transaction.fromAccount === accountId
        || transaction.toAccount === accountId),
    [transactions.data, selectedRange, accountId]
  );
  const report = useMemo(() => {
    const days = new Map();
    const totals = { incoming: 0, outgoing: 0, internalCount: 0 };
    const categories = new Map();
    const logs = [];
    for (const transaction of periodTransactions) {
      if (transaction.status !== "COMPLETED") continue;
      const direction = transactionDirection(transaction);
      if (direction === "internal") {
        totals.internalCount += 1;
        continue;
      }
      if (direction !== "credit" && direction !== "debit") continue;
      const value = Number(transaction.amount) || 0;
      const kind = direction === "credit" ? "incoming" : "outgoing";
      totals[kind] += value;
      const category = transaction.category || (direction === "credit" ? "Income" : "Uncategorized");
      const categoryKey = `${kind}:${category}`;
      const categoryRow = categories.get(categoryKey) || { category, kind, amount: 0, count: 0 };
      categoryRow.amount += value;
      categoryRow.count += 1;
      categories.set(categoryKey, categoryRow);
      logs.push({ ...transaction, direction, category });
      const date = new Date(transaction.createdAt);
      if (Number.isNaN(date.getTime())) continue;
      const key = date.toISOString().slice(0, 10);
      const label = new Intl.DateTimeFormat("en-IN", { month: "short", day: "2-digit" }).format(date);
      const row = days.get(key) || { key, label, incoming: 0, outgoing: 0 };
      row[kind] += value;
      days.set(key, row);
    }
    return { ...totals, chart: [...days.values()].sort((a, b) => a.key.localeCompare(b.key)).slice(-14), categories: [...categories.values()].sort((a, b) => b.amount - a.amount), logs };
  }, [periodTransactions]);
  const monthlyComparison = useMemo(() => {
    const today = new Date();
    const currentStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const previousStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const previousMonthDays = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    const previousEnd = new Date(today.getFullYear(), today.getMonth() - 1, Math.min(today.getDate(), previousMonthDays) + 1);
    const current = new Map();
    const previous = new Map();
    let currentTotal = 0;
    let previousTotal = 0;

    for (const transaction of transactions.data) {
      if (transaction.status !== "COMPLETED" || transactionDirection(transaction) !== "debit") continue;
      if (accountId !== "all" && transaction.accountId !== accountId && transaction.fromAccount !== accountId && transaction.toAccount !== accountId) continue;
      const date = new Date(transaction.createdAt);
      if (Number.isNaN(date.getTime())) continue;
      const amount = Number(transaction.amount) || 0;
      const category = transaction.category || "Uncategorized";
      if (date >= currentStart && date <= today) {
        currentTotal += amount;
        current.set(category, (current.get(category) || 0) + amount);
      } else if (date >= previousStart && date < previousEnd) {
        previousTotal += amount;
        previous.set(category, (previous.get(category) || 0) + amount);
      }
    }

    const categories = new Set([...current.keys(), ...previous.keys()]);
    const rows = [...categories].map((category) => {
      const currentAmount = current.get(category) || 0;
      const previousAmount = previous.get(category) || 0;
      return { category, current: currentAmount, previous: previousAmount, change: currentAmount - previousAmount };
    }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    const currentLabel = new Intl.DateTimeFormat("en-IN", { month: "long" }).format(today);
    const previousLabel = new Intl.DateTimeFormat("en-IN", { month: "long" }).format(previousStart);
    return {
      currentTotal,
      previousTotal,
      difference: currentTotal - previousTotal,
      currentLabel,
      previousLabel,
      cutoffDay: today.getDate(),
      previousCutoffDay: Math.min(today.getDate(), previousMonthDays),
      rows,
      more: rows.filter((row) => row.change > 0),
      less: rows.filter((row) => row.change < 0),
    };
  }, [transactions.data, accountId]);
  const net = report.incoming - report.outgoing;

  function exportReport() {
    downloadCsv("ledgerly-transfer-report.csv", [
      ["Date", "Direction", "Amount", "Category", "Note", "Status", "From account", "To account", "Reference"],
      ...periodTransactions.map((transaction) => [
        transaction.createdAt,
        transactionDirection(transaction),
        transaction.amount,
        transaction.category || "",
        transaction.note || "",
        transaction.status,
        transaction.fromAccount,
        transaction.toAccount,
        transaction.idempotencyKey,
      ]),
    ]);
  }

  return (
    <main className="workspace-content">
      <PageHeader title="Reports & Analytics" description={`Transfer activity for the selected ${selectedRange} period.`} action={<button className="secondary-action" type="button" onClick={exportReport} disabled={!periodTransactions.length}><span className="material-symbols-outlined" aria-hidden="true">download</span>Export CSV</button>} />
      <Notice title="Report scope">
        Summaries use completed transactions in the latest 100 records returned by the API. Transfers between your own accounts are excluded. Categories and notes are recorded for new transfers.
      </Notice>
      {!transactions.available ? <Notice type="error" title="Transaction history unavailable">{transactions.error}</Notice> : null}
      {!accounts.available ? <Notice type="error" title="Account filter unavailable">{accounts.error}</Notice> : null}
      <section className="ledger-metrics report-metrics">
        <article className="ledger-metric"><span>Incoming transfers</span><strong className="amount-positive">{transactions.available ? formatMoney(report.incoming) : "—"}</strong></article>
        <article className="ledger-metric"><span>Outgoing transfers</span><strong className="amount-negative">{transactions.available ? formatMoney(report.outgoing) : "—"}</strong></article>
        <article className="ledger-metric"><span>Net movement</span><strong>{transactions.available ? formatMoney(net) : "—"}</strong></article>
        <article className="ledger-metric"><span>Internal transfers</span><strong>{transactions.available ? report.internalCount : "—"}</strong></article>
      </section>

      <section className="workspace-card report-period-card">
        <div className="table-toolbar"><div><h2>Month-to-date spending comparison</h2><span>Completed debits · {monthlyComparison.currentLabel} 1–{monthlyComparison.cutoffDay} vs {monthlyComparison.previousLabel} 1–{monthlyComparison.previousCutoffDay}</span></div><label className="filter-field report-account-filter"><span>Account</span><select value={accountId} onChange={(event) => setAccountId(event.target.value)}><option value="all">All accounts</option>{accounts.data.map((account, index) => <option key={account._id} value={account._id}>{account.name || `Ledger Account ${index + 1}`}</option>)}</select></label></div>
        <div className="month-compare-metrics">
          <article><span>This month to date</span><strong>{transactions.available ? formatMoney(monthlyComparison.currentTotal) : "—"}</strong></article>
          <article><span>Same period last month</span><strong>{transactions.available ? formatMoney(monthlyComparison.previousTotal) : "—"}</strong></article>
          <article className={monthlyComparison.difference > 0 ? "spend-up" : monthlyComparison.difference < 0 ? "spend-down" : "spend-even"}><span>{monthlyComparison.difference > 0 ? "Spent more" : monthlyComparison.difference < 0 ? "Spent less" : "No change"}</span><strong>{transactions.available ? `${monthlyComparison.difference > 0 ? "+" : monthlyComparison.difference < 0 ? "−" : ""}${formatMoney(Math.abs(monthlyComparison.difference))}` : "—"}</strong></article>
        </div>
        <div className="month-change-grid">
          <section className="month-change-panel"><h3><span className="material-symbols-outlined" aria-hidden="true">trending_up</span>Spent more</h3>{monthlyComparison.more.length ? monthlyComparison.more.map((row) => <div className="month-change-row" key={`more-${row.category}`}><span>{row.category}<small>{formatMoney(row.current)} this month · {formatMoney(row.previous)} {monthlyComparison.previousLabel}</small></span><b className="month-spend-up">+{formatMoney(row.change)}</b></div>) : <p>{transactions.available ? "No categories increased in this period." : transactions.error}</p>}</section>
          <section className="month-change-panel"><h3><span className="material-symbols-outlined" aria-hidden="true">trending_down</span>Spent less</h3>{monthlyComparison.less.length ? monthlyComparison.less.map((row) => <div className="month-change-row" key={`less-${row.category}`}><span>{row.category}<small>{formatMoney(row.current)} this month · {formatMoney(row.previous)} {monthlyComparison.previousLabel}</small></span><b className="month-spend-down">−{formatMoney(Math.abs(row.change))}</b></div>) : <p>{transactions.available ? "No categories decreased in this period." : transactions.error}</p>}</section>
        </div>
        <div className="workspace-card-foot">Comparison uses completed outgoing transfers from the latest 100 API records. Transfers between your own accounts are excluded.</div>
      </section>

      <section className="workspace-card report-period-card">
        <div className="table-toolbar"><div><h2>Debit and credit by category</h2><span>Completed transactions · {selectedRange}</span></div></div>
        {report.categories.length ? <div className="report-category-list">{report.categories.map((row) => <div className="category-flow-row" key={`${row.kind}:${row.category}`}><span><b className={row.kind === "incoming" ? "amount-positive" : "amount-negative"}>{row.kind === "incoming" ? "Credit" : "Debit"}</b> · {row.category} <small>({row.count})</small></span><b>{formatMoney(row.amount)}</b></div>)}</div> : <p>No completed debit or credit records in this period.</p>}
      </section>

      <section className="workspace-card report-period-card">
        <div className="table-toolbar"><div><h2>Time log</h2><span>{report.logs.length} completed debit and credit entries, newest first</span></div></div>
        {report.logs.length ? <div className="report-time-log">{report.logs.map((transaction) => <div className="category-flow-row" key={transaction._id}><span>{formatDate(transaction.createdAt, { dateStyle: "medium", timeStyle: "short" })} · <b className={transaction.direction === "credit" ? "amount-positive" : "amount-negative"}>{transaction.direction === "credit" ? "Credit" : "Debit"}</b> · {transaction.category}{transaction.note ? ` — ${transaction.note}` : ""}</span><b>{formatMoney(transaction.amount)}</b></div>)}</div> : <p>No completed transaction time logs in this period.</p>}
      </section>

      <section className="workspace-card report-chart-card">
        <div className="table-toolbar">
          <div><h2>Incoming vs outgoing transfers</h2><span>Daily totals · {selectedRange}</span></div>
        </div>
        {!transactions.available ? (
          <EmptyPanel icon="cloud_off" title="Report data unavailable">{transactions.error}</EmptyPanel>
        ) : report.chart.length ? (
          <div className="report-bars" role="img" aria-label="Incoming and outgoing transfer totals by day">
            {report.chart.map((day) => {
              const largest = Math.max(1, ...report.chart.flatMap((item) => [item.incoming, item.outgoing]));
              return (
                <div className="report-day" key={day.key} title={`${day.label}: incoming ${formatMoney(day.incoming)}, outgoing ${formatMoney(day.outgoing)}`}>
                  <div className="report-bar-pair">
                    <span className="report-bar incoming" style={{ height: `${Math.max(3, (day.incoming / largest) * 100)}%` }} />
                    <span className="report-bar outgoing" style={{ height: `${Math.max(3, (day.outgoing / largest) * 100)}%` }} />
                  </div>
                  <span>{day.label}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyPanel icon="bar_chart" title="No transfer activity in this period">Try a wider date range to include more of your available transaction history.</EmptyPanel>
        )}
        <div className="chart-legend report-legend"><span><i className="income-dot" />Incoming</span><span><i className="expense-dot" />Outgoing</span></div>
        <div className="workspace-card-foot">Categories and official statement generation are not provided by the backend.</div>
      </section>

      <section className="workspace-card report-period-card">
        <div className="table-toolbar"><div><h2>Selected records</h2><span>{periodTransactions.length} transactions · generated {formatDate(new Date(), { dateStyle: "medium" })}</span></div></div>
        <p>Use Export CSV to download the actual transaction fields used to calculate these figures.</p>
      </section>
    </main>
  );
}
