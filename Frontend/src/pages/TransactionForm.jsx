import { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import EmptyPanel from "../components/workspace/EmptyPanel.jsx";
import Notice from "../components/workspace/Notice.jsx";
import PageHeader from "../components/workspace/PageHeader.jsx";
import { apiRequest } from "../services/api.js";
import { accountLabel, formatMoney } from "../services/ledger.js";

function makeIdempotencyKey() {
  return `ledgerly-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export default function TransactionForm({ transfer = false }) {
  const { accounts, refresh } = useOutletContext();
  const navigate = useNavigate();
  const activeAccounts = accounts.data.filter((account) => account.status === "ACTIVE");
  const [fromAccount, setFromAccount] = useState(activeAccounts[0]?._id || "");
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Transfer");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [idempotencyKey] = useState(makeIdempotencyKey);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const value = Number(amount);

    if (!accounts.available) {
      setError("Account data is unavailable; a transfer cannot be submitted safely.");
      return;
    }
    if (!activeAccounts.some((account) => account._id === fromAccount)) {
      setError("Choose an active sender account.");
      return;
    }
    if (!/^[a-f\d]{24}$/i.test(toAccount.trim())) {
      setError("Enter a valid 24-character recipient account ID.");
      return;
    }
    if (fromAccount === toAccount.trim()) {
      setError("The sender and recipient accounts must be different.");
      return;
    }
    if (!Number.isFinite(value) || value < 1 || !/^\d+(\.\d{1,2})?$/.test(amount)) {
      setError("Enter an amount of at least ₹1.00 with no more than two decimal places.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiRequest("/transactions", {
        method: "POST",
        body: JSON.stringify({
          fromAccount,
          toAccount: toAccount.trim(),
          amount: value,
          category,
          note,
          idempotencyKey,
        }),
      });
      const transaction = result?.transaction;
      if (!transaction?._id) {
        throw new Error("The API accepted the request but did not return a transaction record.");
      }
      refresh();
      navigate(`/transactions/${transaction._id}`, { state: { transaction } });
    } catch (requestError) {
      setError(requestError.message || "The transfer could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="workspace-content">
      <div className="back-link-row"><Link to="/transactions"><span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>Back to transactions</Link></div>
      <PageHeader
        eyebrow={transfer ? "Transfer money" : "New ledger transaction"}
        title={transfer ? "Transfer money" : "Add transaction"}
        description="This backend records account-to-account transfers only. It does not support standalone income or expense entries."
      />
      {accounts.error ? <Notice type="error" title="Accounts unavailable">{accounts.error}</Notice> : null}
      {error ? <Notice type="error" title="Transfer not submitted">{error}</Notice> : null}
      {!accounts.available ? (
        <EmptyPanel icon="cloud_off" title="Accounts could not be loaded">
          {accounts.error || "Account data is required to submit a transfer."}
        </EmptyPanel>
      ) : !activeAccounts.length ? (
        <EmptyPanel icon="account_balance" title="No active accounts">
          Create an account before sending a transfer.
          <Link className="text-link" to="/accounts">Go to accounts</Link>
        </EmptyPanel>
      ) : (
        <div className="transaction-form-layout">
          <form className="workspace-card ledger-form" onSubmit={handleSubmit}>
            <div className="form-section-title"><span className="material-symbols-outlined" aria-hidden="true">sync_alt</span><div><h2>Transfer details</h2><p>Amounts are submitted in the backend account currency.</p></div></div>
            <label className="workspace-field">
              <span>Sender account <b>*</b></span>
              <select value={fromAccount} onChange={(event) => setFromAccount(event.target.value)} required disabled={!accounts.available}>
                {activeAccounts.map((account, index) => <option key={account._id} value={account._id}>{accountLabel(account, index)} · {formatMoney(account.balance, account.currency || "INR")}</option>)}
              </select>
            </label>
            <label className="workspace-field">
              <span>Recipient account ID <b>*</b></span>
              <input list="ledger-recipient-accounts" value={toAccount} onChange={(event) => setToAccount(event.target.value)} placeholder="24-character account ID" autoComplete="off" required />
              <datalist id="ledger-recipient-accounts">
                {accounts.data.map((account, index) => <option key={account._id} value={account._id}>{accountLabel(account, index)}</option>)}
              </datalist>
              <small>The backend has no recipient directory. Use the exact ID of an existing active account.</small>
            </label>
            <label className="workspace-field">
              <span>Amount (INR) <b>*</b></span>
              <div className="currency-input"><span>₹</span><input type="number" min="1" step="0.01" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" required /></div>
            </label>
            <label className="workspace-field">
              <span>Category</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                {['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Education', 'Transfer', 'Other'].map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="workspace-field">
              <span>Note (optional)</span>
              <input value={note} onChange={(event) => setNote(event.target.value)} maxLength={120} placeholder="What was this transfer for?" />
            </label>
            <div className="ledger-form-note"><span className="material-symbols-outlined" aria-hidden="true">verified_user</span><p>Transfers are processed atomically by the backend. Internal transfers are represented as debit and credit entries.</p></div>
            <div className="ledger-form-actions"><Link className="secondary-action" to="/transactions">Cancel</Link><button className="primary-action" type="submit" disabled={submitting || !accounts.available || !activeAccounts.length}>{submitting ? "Submitting…" : transfer ? "Send transfer" : "Save transaction"}</button></div>
          </form>
          <aside className="workspace-card transfer-summary">
            <span className="page-eyebrow">Live preview</span>
            <h2>Transfer summary</h2>
            <div className="preview-amount">{amount && Number(amount) >= 1 ? formatMoney(Number(amount)) : formatMoney(0)}</div>
            <dl>
              <div><dt>From</dt><dd>{accountLabel(activeAccounts.find((account) => account._id === fromAccount), activeAccounts.findIndex((account) => account._id === fromAccount))}</dd></div>
              <div><dt>To</dt><dd>{toAccount ? `${toAccount.slice(0, 10)}…` : "Recipient not selected"}</dd></div>
              <div><dt>Reference</dt><dd>Generated for this request</dd></div>
            </dl>
            <p>Balances will update only after the server confirms the transaction.</p>
          </aside>
        </div>
      )}
    </main>
  );
}
