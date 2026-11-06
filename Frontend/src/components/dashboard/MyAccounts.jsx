import EmptyState from "./EmptyState.jsx";
import { Link } from "react-router-dom";
import { accountLabel, formatCurrencyTotals, formatMoney } from "../../services/ledger.js";

export default function MyAccounts({ accounts, unavailable, onCreateAccount, creatingAccount }) {
  return (
    <section className="dashboard-card accounts-card">
      <div className="card-title-row">
        <div className="title-with-count accounts-title">
          <h2>My Accounts</h2>
          <span>{unavailable ? "Unavailable" : `${accounts.filter((account) => account.status === "ACTIVE").length} Active`}</span>
        </div>
        <div className="account-actions">
          <button type="button" onClick={onCreateAccount} disabled={creatingAccount}>
            <span className="material-symbols-outlined">add</span>
            {creatingAccount ? "Creating" : "New account"}
          </button>
          <Link className="account-link" to="/accounts">View accounts <span className="material-symbols-outlined">chevron_right</span></Link>
        </div>
      </div>

      {accounts.length ? (
        <div className="account-list">
          {accounts.map((account, index) => (
            <Link className="account-row account-row-link" to={`/accounts/${account._id}`} key={account._id || account.id}>
              <div className="account-row-head">
                <span className="material-symbols-outlined">account_balance</span>
                <strong>{accountLabel(account, index)}</strong>
                <em>{account.status || "ACTIVE"}</em>
              </div>
              <div className="account-row-foot">
                <span>{account.currency || "INR"}</span>
                <strong>{formatMoney(account.balance || 0, account.currency || "INR")}</strong>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          compact
          icon="account_balance"
          title={unavailable ? "Accounts unavailable" : "No accounts found"}
          message={unavailable ? "Account listing is currently unavailable." : "Create an account to start recording ledger transfers."}
        />
      )}

      <div className="account-total">
        <span>Consolidated Total</span>
        <strong>{unavailable ? "Unavailable" : formatCurrencyTotals(accounts)}</strong>
      </div>
    </section>
  );
}
