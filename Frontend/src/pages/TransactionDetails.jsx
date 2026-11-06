import { Link, useLocation, useOutletContext, useParams } from "react-router-dom";
import EmptyPanel from "../components/workspace/EmptyPanel.jsx";
import PageHeader, { PageAction } from "../components/workspace/PageHeader.jsx";
import Notice from "../components/workspace/Notice.jsx";
import { formatDate, formatMoney, transactionDirection, transactionLabel } from "../services/ledger.js";

export default function TransactionDetails() {
  const { transactionId } = useParams();
  const location = useLocation();
  const { accounts, transactions } = useOutletContext();
  const transaction = transactions.data.find((item) => item._id === transactionId)
    || (location.state?.transaction?._id === transactionId ? location.state.transaction : null);

  if (!transactions.available && !transaction) {
    return <main className="workspace-content"><Notice type="error" title="Transaction data unavailable">{transactions.error}</Notice></main>;
  }
  if (!transaction) {
    return (
      <main className="workspace-content">
        <PageHeader title="Transaction not found" description="This record is not present in the latest 100 transactions returned by the API." action={<PageAction to="/transactions" icon="arrow_back">Back to transactions</PageAction>} />
        <EmptyPanel icon="search_off" title="Record unavailable">It may be older than the API's history limit or outside your accessible accounts.</EmptyPanel>
      </main>
    );
  }

  const direction = transactionDirection(transaction);
  const account = accounts.data.find((item) => item._id === transaction.accountId);
  const currency = account?.currency || "INR";

  return (
    <main className="workspace-content">
      <div className="back-link-row"><Link to="/transactions"><span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>Back to transactions</Link></div>
      <PageHeader eyebrow="Record inspection" title="Transaction details" description="Transfer details provided by the ledger API." action={<PageAction to="/accounts" icon="account_balance">View accounts</PageAction>} />
      <section className="transaction-detail-hero">
        <div className="detail-amount">
          <span>{direction === "credit" ? "Incoming transfer" : direction === "debit" ? "Outgoing transfer" : "Internal transfer"}</span>
          <strong className={direction === "credit" ? "amount-positive" : direction === "debit" ? "amount-negative" : ""}>{direction === "credit" ? "+" : direction === "debit" ? "−" : ""}{formatMoney(transaction.amount, currency)}</strong>
          <span>{transactionLabel(transaction)}</span>
        </div>
        <span className={`record-status ${String(transaction.status || "").toLowerCase()}`}>{transaction.status || "Unknown"}</span>
      </section>
      <section className="workspace-card details-grid-card">
        <h2>Transaction information</h2>
        <dl className="details-grid">
          <div><dt>Transaction ID</dt><dd className="mono-text">{transaction._id}</dd></div>
          <div><dt>Reference key</dt><dd className="mono-text">{transaction.idempotencyKey || "Not provided"}</dd></div>
          <div><dt>Created</dt><dd>{formatDate(transaction.createdAt, { dateStyle: "full", timeStyle: "short" })}</dd></div>
          <div><dt>Last updated</dt><dd>{formatDate(transaction.updatedAt, { dateStyle: "full", timeStyle: "short" })}</dd></div>
          <div><dt>From account</dt><dd><Link to={`/accounts/${transaction.fromAccount}`}>{accountName(transaction.fromAccount, accounts.data)}</Link><code>{transaction.fromAccount}</code></dd></div>
          <div><dt>To account</dt><dd><Link to={`/accounts/${transaction.toAccount}`}>{accountName(transaction.toAccount, accounts.data)}</Link><code>{transaction.toAccount}</code></dd></div>
        </dl>
        <Notice title="Ledger semantics">Each transfer creates a debit and a credit. Transfers between your own accounts are excluded from external cash-flow totals.</Notice>
      </section>
    </main>
  );
}

function accountName(id, accounts) {
  const index = accounts.findIndex((account) => account._id === id);
  return index < 0 ? "External account" : accounts[index].name || `Ledger Account ${index + 1}`;
}
