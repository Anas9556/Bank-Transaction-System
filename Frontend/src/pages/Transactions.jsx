import { useMemo, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import EmptyPanel from "../components/workspace/EmptyPanel.jsx";
import Notice from "../components/workspace/Notice.jsx";
import PageHeader, { PageAction } from "../components/workspace/PageHeader.jsx";
import { downloadCsv, filterTransactionsByRange, formatDate, formatMoney, transactionDirection, transactionLabel } from "../services/ledger.js";

export default function Transactions() {
  const { accounts, transactions, selectedRange } = useOutletContext();
  const [params, setParams] = useSearchParams();
  const [directionFilter, setDirectionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const query = params.get("q") || "";

  const visible = useMemo(() => {
    return filterTransactionsByRange(transactions.data, selectedRange)
      .filter((transaction) => {
        const searchText = [
          transaction.description,
          transaction.idempotencyKey,
          transaction._id,
          transaction.fromAccount,
          transaction.toAccount,
          transaction.accountName,
        ].join(" ").toLowerCase();
        return !query || searchText.includes(query.toLowerCase());
      })
      .filter((transaction) => directionFilter === "all" || transactionDirection(transaction) === directionFilter)
      .filter((transaction) => statusFilter === "all" || transaction.status === statusFilter)
      .filter((transaction) => accountFilter === "all"
        || transaction.accountId === accountFilter
        || transaction.fromAccount === accountFilter
        || transaction.toAccount === accountFilter);
  }, [transactions.data, selectedRange, query, directionFilter, statusFilter, accountFilter]);

  function exportCsv() {
    downloadCsv("ledgerly-transactions.csv", [
      ["Transaction ID", "Date", "Description", "Direction", "Amount", "Currency", "Status", "Account ID", "Reference"],
      ...visible.map((transaction) => [
        transaction._id,
        transaction.createdAt,
        transactionLabel(transaction),
        transactionDirection(transaction),
        transaction.amount,
        accounts.data.find((account) => account._id === transaction.accountId)?.currency || "INR",
        transaction.status,
        transaction.accountId,
        transaction.idempotencyKey,
      ]),
    ]);
  }

  return (
    <main className="workspace-content">
      <PageHeader
        title="Transactions"
        description="Review transfers and ledger records returned for your accounts."
        action={<div className="header-action-group"><button className="secondary-action" type="button" onClick={exportCsv} disabled={!visible.length}><span className="material-symbols-outlined" aria-hidden="true">download</span>Export CSV</button><PageAction to="/transactions/new" icon="add">Add transaction</PageAction></div>}
      />
      {!transactions.available ? <Notice type="error" title="Transaction history unavailable">{transactions.error}</Notice> : null}
      {transactions.available ? <Notice title="Data scope">The API returns at most the 100 most recent transactions. Filters and CSV export apply only to those records.</Notice> : null}

      <section className="workspace-card filter-card">
        <label className="workspace-search wide-search">
          <span className="material-symbols-outlined" aria-hidden="true">search</span>
          <input value={query} onChange={(event) => setParams(event.target.value ? { q: event.target.value } : {})} placeholder="Search description, account ID, or reference…" aria-label="Search transactions" />
        </label>
        <label className="filter-field"><span>Direction</span><select value={directionFilter} onChange={(event) => setDirectionFilter(event.target.value)}><option value="all">All directions</option><option value="credit">Incoming</option><option value="debit">Outgoing</option><option value="internal">Internal</option></select></label>
        <label className="filter-field"><span>Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option>{Array.from(new Set(transactions.data.map((item) => item.status).filter(Boolean))).map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
        <label className="filter-field"><span>Account</span><select value={accountFilter} onChange={(event) => setAccountFilter(event.target.value)}><option value="all">All accounts</option>{accounts.data.map((account, index) => <option key={account._id} value={account._id}>{account.name || `Ledger Account ${index + 1}`}</option>)}</select></label>
      </section>

      <section className="workspace-card">
        <div className="table-toolbar"><div><h2>All transactions</h2><span>{transactions.available ? `${visible.length} matching records` : "Not loaded"}</span></div></div>
        {!transactions.available ? (
          <EmptyPanel icon="cloud_off" title="Transaction history could not be loaded">{transactions.error}</EmptyPanel>
        ) : visible.length ? (
          <div className="responsive-table">
            <table className="workspace-table">
              <thead><tr><th>Description / reference</th><th>Record ID</th><th>Date</th><th>Account</th><th>Direction</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>{visible.map((transaction) => {
                const direction = transactionDirection(transaction);
                const currency = accounts.data.find((account) => account._id === transaction.accountId)?.currency || "INR";
                return (
                  <tr key={transaction._id}>
                    <td><Link className="record-title" to={`/transactions/${transaction._id}`}>{transactionLabel(transaction)}</Link><span className="table-subtext">{transaction.idempotencyKey || "No reference"}</span></td>
                    <td className="mono-text">{transaction._id}</td>
                    <td>{formatDate(transaction.createdAt, { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td>{transaction.accountName || "Account unavailable"}</td>
                    <td><span className={`direction-chip ${direction}`}>{direction}</span></td>
                    <td className={direction === "credit" ? "amount-positive" : direction === "debit" ? "amount-negative" : ""}>{direction === "credit" ? "+" : direction === "debit" ? "−" : ""}{formatMoney(transaction.amount, currency)}</td>
                    <td><span className={`record-status ${String(transaction.status || "").toLowerCase()}`}>{transaction.status || "Unknown"}</span></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        ) : (
          <EmptyPanel icon="receipt_long" title={transactions.data.length ? "No matching transactions" : "No transactions yet"}>
            {transactions.data.length ? "Adjust the search or filters to see more records." : "Transactions recorded through Ledgerly will appear here."}
          </EmptyPanel>
        )}
      </section>
    </main>
  );
}
