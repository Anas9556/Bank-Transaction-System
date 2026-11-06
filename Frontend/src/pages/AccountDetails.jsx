import { Link, useOutletContext, useParams } from "react-router-dom";
import EmptyPanel from "../components/workspace/EmptyPanel.jsx";
import Notice from "../components/workspace/Notice.jsx";
import PageHeader, { PageAction } from "../components/workspace/PageHeader.jsx";
import { accountLabel, filterTransactionsByRange, formatDate, formatMoney, transactionDirection, transactionLabel } from "../services/ledger.js";

export default function AccountDetails() {
  const { accountId } = useParams();
  const { accounts, transactions, selectedRange } = useOutletContext();
  const account = accounts.data.find((item) => item._id === accountId);
  const accountIndex = accounts.data.indexOf(account);
  const events = filterTransactionsByRange(transactions.data, selectedRange)
    .filter((item) => item.accountId === accountId || item.fromAccount === accountId || item.toAccount === accountId);

  if (!accounts.available) {
    return <main className="workspace-content"><Notice type="error" title="Account data unavailable">{accounts.error}</Notice></main>;
  }
  if (!account) {
    return (
      <main className="workspace-content">
        <PageHeader title="Account not found" description="This account is not present in the accounts returned for your session." action={<PageAction to="/accounts" icon="arrow_back">Back to accounts</PageAction>} />
        <EmptyPanel icon="search_off" title="Account unavailable">The account may not exist or may belong to another user.</EmptyPanel>
      </main>
    );
  }

  return (
    <main className="workspace-content">
      <div className="back-link-row"><Link to="/accounts"><span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>Back to accounts</Link></div>
      <PageHeader
        eyebrow="Account details"
        title={accountLabel(account, accountIndex)}
        description="Account balance and ledger activity supplied by the backend."
        action={<PageAction to="/transfers" icon="sync_alt">Transfer money</PageAction>}
      />
      {!transactions.available ? <Notice type="error" title="Activity unavailable">{transactions.error}</Notice> : null}
      <section className="account-detail-hero">
        <div>
          <span className="page-eyebrow">Current balance</span>
          <strong>{formatMoney(account.balance, account.currency || "INR")}</strong>
          <span>{account.currency || "INR"} · {account.status || "Unknown status"}</span>
        </div>
        <div className="account-detail-id">
          <span>Account ID</span>
          <code>{account._id}</code>
          <span>Created {formatDate(account.createdAt, { dateStyle: "medium" })}</span>
        </div>
      </section>

      <section className="workspace-card">
        <div className="table-toolbar"><div><h2>Account transactions</h2><span>{transactions.available ? `${events.length} of up to 100 records` : "Unavailable"}</span></div></div>
        {!transactions.available ? (
          <EmptyPanel icon="cloud_off" title="Ledger activity could not be loaded">{transactions.error}</EmptyPanel>
        ) : events.length ? (
          <div className="responsive-table">
            <table className="workspace-table">
              <thead><tr><th>Transaction</th><th>Reference</th><th>Date</th><th>Direction</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>{events.map((event) => {
                const direction = transactionDirection(event);
                return (
                  <tr key={event._id}>
                    <td><Link className="record-title" to={`/transactions/${event._id}`}>{transactionLabel(event)}</Link></td>
                    <td className="mono-text">{event.idempotencyKey || event._id}</td>
                    <td>{formatDate(event.createdAt, { dateStyle: "medium", timeStyle: "short" })}</td>
                    <td>{direction}</td>
                    <td className={direction === "credit" ? "amount-positive" : direction === "debit" ? "amount-negative" : ""}>{direction === "credit" ? "+" : direction === "debit" ? "−" : ""}{formatMoney(event.amount, account.currency || "INR")}</td>
                    <td><span className={`record-status ${String(event.status || "").toLowerCase()}`}>{event.status || "Unknown"}</span></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        ) : (
          <EmptyPanel icon="receipt_long" title="No transactions for this account">
            This account has no matching entries in the latest records returned by the API.
          </EmptyPanel>
        )}
      </section>
    </main>
  );
}
