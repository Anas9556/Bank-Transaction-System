import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { apiRequest } from "../services/api.js";
import { formatDate, formatMoney } from "../services/ledger.js";

function makeIdempotencyKey() {
  return `initial-funds-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export default function SystemConsole() {
  const { user, accounts, transactions, refresh } = useOutletContext();
  const [recipientId, setRecipientId] = useState("");
  const [amount, setAmount] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(makeIdempotencyKey);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);

  const systemBalance = useMemo(() => accounts.data.reduce((total, account) => total + (Number(account.balance) || 0), 0), [accounts.data]);
  const operations = useMemo(
    () => transactions.data.filter((transaction) => transaction.fromAccount && accounts.data.some((account) => account._id === transaction.fromAccount)).slice(0, 3),
    [transactions.data, accounts.data]
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setReceipt(null);
    const numericAmount = Number(amount);
    const normalizedRecipient = recipientId.trim();

    if (!accounts.available) return setError(accounts.error || "System account data is unavailable.");
    if (!accounts.data.length) return setError("No system funding account is configured.");
    if (!/^[a-f\d]{24}$/i.test(normalizedRecipient)) return setError("Enter a valid 24-character recipient account ID.");
    if (accounts.data.some((account) => account._id === normalizedRecipient)) return setError("Choose a recipient account outside the system funding accounts.");
    if (!Number.isFinite(numericAmount) || numericAmount < 1 || !/^\d+(\.\d{1,2})?$/.test(amount)) return setError("Enter an amount of at least ₹1.00 with no more than two decimal places.");
    if (!confirmed) return setError("Confirm that the recipient account ID has been checked.");

    setSubmitting(true);
    try {
      const result = await apiRequest("/transactions/system/initial-funds", {
        method: "POST",
        body: JSON.stringify({ toAccount: normalizedRecipient, amount: numericAmount, idempotencyKey }),
      });
      if (!result?.transaction?._id) throw new Error("The API did not return the funding transaction record.");
      setReceipt(result.transaction);
      setRecipientId("");
      setAmount("");
      setConfirmed(false);
      setIdempotencyKey(makeIdempotencyKey());
      refresh();
    } catch (requestError) {
      setError(requestError.message || "The funding request could not be completed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="system-content">
      <div className="system-eyebrow"><span className="system-live-dot" /> Restricted operator workspace</div>
      <div className="system-title-row">
        <div><h1>Funding operations</h1><p>Issue opening funds from the provisioned system account. Each confirmed request is written to the ledger as a completed transaction.</p></div>
        <span className="system-title-stamp"><span className="material-symbols-outlined" aria-hidden="true">admin_panel_settings</span><span>OPERATOR<br /><b>{user?.name || "SYSTEM"}</b></span></span>
      </div>

      {!accounts.available || !transactions.available ? (
        <div className="system-status-banner error" role="alert"><span className="material-symbols-outlined" aria-hidden="true">cloud_off</span><div><strong>Ledger data unavailable</strong>{[accounts.error, transactions.error].filter(Boolean).join(" ") || "Refresh the workspace after the backend is available."}</div></div>
      ) : null}
      {error ? <div className="system-status-banner error" role="alert"><span className="material-symbols-outlined" aria-hidden="true">error</span><div><strong>Request not submitted</strong>{error}</div></div> : null}
      {receipt ? <div className="system-status-banner success" role="status"><span className="material-symbols-outlined" aria-hidden="true">check_circle</span><div><strong>Funds issued successfully</strong>Transaction {receipt._id} has been recorded.</div></div> : null}

      <div className="system-overview">
        <article className="system-overview-card treasury-card"><div className="system-overview-label">Funding pool balance <span className="material-symbols-outlined" aria-hidden="true">account_balance_wallet</span></div><strong>{accounts.available ? formatMoney(systemBalance) : "Unavailable"}</strong><small>{accounts.available ? `${accounts.data.length} system account${accounts.data.length === 1 ? "" : "s"} · ledger-derived balance` : "Account lookup failed"}</small><span className="treasury-orbit orbit-one" /><span className="treasury-orbit orbit-two" /></article>
        <article className="system-overview-card journal-card"><div className="system-overview-label">Ledger records loaded <span className="material-symbols-outlined" aria-hidden="true">receipt_long</span></div><strong>{transactions.available ? transactions.data.length : "—"}</strong><small>Latest transaction history for this system account</small><div className="journal-mini-bars" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div></article>
      </div>

      <div className="system-columns">
        <section className="system-card">
          <div className="system-card-heading"><h2>Issue initial funds</h2><p>Credit an active recipient account from the system funding account.</p></div>
          <form className="system-fund-form" onSubmit={handleSubmit}>
            <label className="system-field">Recipient account ID
              <input inputMode="text" autoComplete="off" spellCheck="false" maxLength={24} value={recipientId} disabled={submitting} onChange={(event) => { setError(""); setRecipientId(event.target.value); setIdempotencyKey(makeIdempotencyKey()); }} placeholder="24-character MongoDB account ID" required />
              <small>The backend does not expose a recipient directory. Verify the ID with the recipient before issuing funds.</small>
            </label>
            <label className="system-field">Amount to issue
              <div className="system-amount-input"><span>₹</span><input type="number" min="1" step="0.01" inputMode="decimal" value={amount} disabled={submitting} onChange={(event) => { setError(""); setAmount(event.target.value); setIdempotencyKey(makeIdempotencyKey()); }} placeholder="0.00" required /></div>
            </label>
            <label className="system-confirm-row"><input type="checkbox" checked={confirmed} disabled={submitting} onChange={(event) => setConfirmed(event.target.checked)} /><span>I verified the destination account ID and amount for this funding request.</span></label>
            <button className="system-submit" type="submit" disabled={submitting || !accounts.available || !accounts.data.length || !confirmed}>
              <span className="material-symbols-outlined" aria-hidden="true">south_west</span>{submitting ? "Submitting funding request…" : "Issue funds"}
            </button>
          </form>
          {receipt ? <div className="system-receipt"><strong>Ledger receipt</strong>Reference: {receipt._id}<br />Recipient: {receipt.toAccount}<br />Amount: {formatMoney(receipt.amount)}<br />Recorded: {formatDate(receipt.createdAt, { dateStyle: "medium", timeStyle: "short" })}</div> : null}
        </section>

        <div>
          <section className="system-card">
            <div className="system-card-heading"><h2>System funding accounts</h2><p>Balances are read from ledger entries.</p></div>
            <div className="system-account-list">{accounts.data.length ? accounts.data.map((account, index) => <div className="system-account-row" key={account._id}><span><i className="system-account-icon material-symbols-outlined" aria-hidden="true">account_balance</i><span>{account.name || `Pool account ${index + 1}`}<small>{account.status || "Status unavailable"}</small></span></span><strong>{formatMoney(account.balance, account.currency || "INR")}</strong></div>) : <div className="system-empty">{accounts.available ? "No system account has been provisioned." : "System account balance unavailable."}</div>}</div>
          </section>
          <section className="system-card system-activity">
            <div className="system-card-heading"><h2>Recent funding activity</h2><p>Latest records involving the system account.</p></div>
            <div className="system-activity-list">{operations.length ? operations.map((operation) => <div className="system-activity-row" key={operation._id}><span className="activity-icon material-symbols-outlined" aria-hidden="true">south_west</span><div className="system-activity-copy"><div className="system-activity-title"><strong>Funds issued</strong><span className={`system-status-tag ${String(operation.status || "").toLowerCase()}`}>{operation.status || "Unknown"}</span></div><span className="activity-destination">To account <b>{operation.toAccount}</b></span><span className="activity-date">{formatDate(operation.createdAt, { dateStyle: "medium", timeStyle: "short" })}</span></div><b className="activity-amount">− {formatMoney(operation.amount)}</b></div>) : <div className="system-empty">{transactions.available ? "No funding operations recorded yet." : "Transaction history unavailable."}</div>}</div>
          </section>
        </div>
      </div>
      <p className="system-footnote">Funding requests are authorized on the server for system users only. Successful transactions debit the system account and credit the selected active account atomically.</p>
    </section>
  );
}
