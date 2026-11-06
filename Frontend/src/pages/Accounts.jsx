import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import EmptyPanel from "../components/workspace/EmptyPanel.jsx";
import Notice from "../components/workspace/Notice.jsx";
import PageHeader, { PageAction } from "../components/workspace/PageHeader.jsx";
import { apiRequest } from "../services/api.js";
import { accountLabel, formatCurrencyTotals, formatDate, formatMoney } from "../services/ledger.js";

export default function Accounts() {
  const { accounts, refresh } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(() => searchParams.get("new") === "1");
  const [newName, setNewName] = useState("");
  const [editingAccountId, setEditingAccountId] = useState("");
  const [editingName, setEditingName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (searchParams.has("new")) setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);
  const visible = useMemo(() => {
    const searchName = query.trim().toLocaleLowerCase("en-IN");
    if (!searchName) return accounts.data;
    return accounts.data.filter((account, index) =>
      accountLabel(account, index).trim().toLocaleLowerCase("en-IN").includes(searchName)
    );
  }, [accounts.data, query]);

  async function handleCreate(event) {
    event.preventDefault();
    setCreating(true);
    setError("");
    setMessage("");
    try {
      await apiRequest("/accounts", { method: "POST", body: JSON.stringify({ name: newName.trim() }) });
      setMessage(`“${newName.trim()}” created. Balances are calculated by the ledger service.`);
      setNewName("");
      setShowCreate(false);
      refresh();
    } catch (requestError) {
      setError(requestError.message || "Unable to create account.");
    } finally {
      setCreating(false);
    }
  }

  function beginRename(account, index) {
    setError("");
    setMessage("");
    setEditingAccountId(account._id);
    setEditingName(accountLabel(account, index));
  }

  async function handleRename(event, accountId) {
    event.preventDefault();
    const name = editingName.trim();
    if (!name || name.length > 40) {
      setError("Account name must be between 1 and 40 characters.");
      return;
    }

    setSavingName(true);
    setError("");
    setMessage("");
    try {
      await apiRequest(`/accounts/${accountId}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      setEditingAccountId("");
      setEditingName("");
      setMessage(`Account renamed to “${name}”.`);
      refresh();
    } catch (requestError) {
      setError(requestError.message || "Unable to rename account.");
    } finally {
      setSavingName(false);
    }
  }

  return (
    <main className="workspace-content">
      <PageHeader
        title="Accounts"
        description="Review your accounts and current ledger balances."
        action={<PageAction onClick={() => { setShowCreate((open) => !open); setError(""); }} disabled={!accounts.available} icon={showCreate ? "close" : "add"}>{showCreate ? "Cancel" : "Add account"}</PageAction>}
      />
      {!accounts.available ? <Notice type="error" title="Account data unavailable">{accounts.error}</Notice> : null}
      {error ? <Notice type="error" title="Account update failed">{error}</Notice> : null}
      {message ? <Notice type="success" title="Account updated">{message}</Notice> : null}

      {showCreate ? (
        <section className="workspace-card account-create-card">
          <div className="table-toolbar"><div><h2>Create a named account</h2><span>Choose a label you will recognize across your ledger.</span></div></div>
          <form className="account-name-form" onSubmit={handleCreate}>
            <label className="workspace-field"><span>Account name <b>*</b></span><input autoFocus value={newName} onChange={(event) => setNewName(event.target.value)} maxLength={40} placeholder="e.g. Everyday spending" required /></label>
            <div className="account-name-form-actions"><button className="secondary-action" type="button" onClick={() => setShowCreate(false)}>Cancel</button><button className="primary-action" type="submit" disabled={creating || !accounts.available}>{creating ? "Creating…" : "Create account"}</button></div>
          </form>
        </section>
      ) : null}

      <section className="ledger-metrics">
        <article className="ledger-metric"><span>Total accounts</span><strong>{accounts.available ? accounts.data.length : "—"}</strong></article>
        <article className="ledger-metric"><span>Balances by currency</span><strong>{accounts.available ? formatCurrencyTotals(accounts.data) : "—"}</strong></article>
        <article className="ledger-metric"><span>Active accounts</span><strong>{accounts.available ? accounts.data.filter((account) => account.status === "ACTIVE").length : "—"}</strong></article>
      </section>

      <section className="workspace-card">
        <div className="table-toolbar">
          <div><h2>All accounts</h2><span>{accounts.available ? `${visible.length} shown` : "Not loaded"}</span></div>
          <label className="workspace-search">
            <span className="material-symbols-outlined" aria-hidden="true">search</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by account name…" aria-label="Search accounts by name" />
          </label>
        </div>
        {!accounts.available ? (
          <EmptyPanel icon="cloud_off" title="Accounts could not be loaded">{accounts.error}</EmptyPanel>
        ) : visible.length ? (
          <div className="responsive-table">
            <table className="workspace-table">
              <thead><tr><th>Account</th><th>Identifier</th><th>Currency</th><th>Balance</th><th>Status</th><th>Created</th><th /></tr></thead>
              <tbody>
                {visible.map((account) => {
                  const index = accounts.data.indexOf(account);
                  return (
                    <tr key={account._id}>
                      <td>{editingAccountId === account._id ? (
                        <form className="account-rename-form" onSubmit={(event) => handleRename(event, account._id)}>
                          <input autoFocus value={editingName} onChange={(event) => setEditingName(event.target.value)} maxLength={40} aria-label="Account name" required />
                          <button className="table-icon-link" type="submit" disabled={savingName} aria-label="Save account name"><span className="material-symbols-outlined" aria-hidden="true">check</span></button>
                          <button className="table-icon-link" type="button" onClick={() => { setEditingAccountId(""); setEditingName(""); }} aria-label="Cancel rename"><span className="material-symbols-outlined" aria-hidden="true">close</span></button>
                        </form>
                      ) : <div className="account-name-cell"><Link className="record-title" to={`/accounts/${account._id}`}>{accountLabel(account, index)}</Link><button className="account-rename-button" type="button" onClick={() => beginRename(account, index)} aria-label={`Rename ${accountLabel(account, index)}`} title="Rename account"><span className="material-symbols-outlined" aria-hidden="true">edit</span></button></div>}</td>
                      <td className="mono-text">{account._id}</td>
                      <td>{account.currency || "INR"}</td>
                      <td className="amount-cell">{formatMoney(account.balance, account.currency || "INR")}</td>
                      <td><span className={`record-status ${String(account.status || "").toLowerCase()}`}>{account.status || "Unknown"}</span></td>
                      <td>{formatDate(account.createdAt, { dateStyle: "medium" })}</td>
                      <td><Link className="table-icon-link" to={`/accounts/${account._id}`} aria-label={`View ${accountLabel(account, index)}`}><span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span></Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyPanel icon="account_balance" title={query ? "No matching accounts" : "No accounts yet"}>
            {query ? "Try a different name or identifier." : "Create an account to start using the ledger."}
          </EmptyPanel>
        )}
        {accounts.available ? <div className="workspace-card-foot">Balances are provided by the backend ledger aggregation.</div> : null}
      </section>
    </main>
  );
}
