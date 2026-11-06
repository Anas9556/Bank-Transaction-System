import EmptyState from "./EmptyState.jsx";
import { Link } from "react-router-dom";
import { formatDate, formatMoney, transactionDirection, transactionLabel } from "../../services/ledger.js";

export default function RecentTransactions({ transactions, unavailable, onNew }) {
  const visible = transactions.slice(0, 5);

  return (
    <section className="dashboard-card transactions-card">
      <div className="card-title-row">
        <div className="title-with-count">
          <h2>Recent Transactions</h2>
          <span>{unavailable ? "Unavailable" : `${visible.length} Recorded`}</span>
        </div>
        <div className="card-actions">
          <Link to="/transactions">View all <span className="material-symbols-outlined">arrow_forward</span></Link>
          <button type="button" onClick={onNew}><span className="material-symbols-outlined">add</span> New</button>
        </div>
      </div>

      {visible.length ? (
        <div className="table-scroll">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Transaction / Entity</th>
                <th>Category</th>
                <th>Date</th>
                <th>Account</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((transaction) => (
                <tr key={transaction._id || transaction.id}>
                  <td>
                    <div className="tx-entity">
                      <span className="tx-icon material-symbols-outlined">receipt_long</span>
                      <div>
                        <Link className="transaction-name-link" to={`/transactions/${transaction._id}`}>{transactionLabel(transaction)}</Link>
                        <span>{transaction.idempotencyKey || transaction._id || "No reference"}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className="category-pill">{transaction.category || "Uncategorized"}</span></td>
                  <td>{formatDate(transaction.createdAt, { month: "short", day: "2-digit", year: "numeric" })}</td>
                  <td>{transaction.accountName || "Account unavailable"}</td>
                  <td className={transactionDirection(transaction) === "credit" ? "amount-positive" : transactionDirection(transaction) === "internal" ? "" : "amount-negative"}>
                    {transactionDirection(transaction) === "credit" ? "+" : transactionDirection(transaction) === "internal" ? "" : "-"}{formatMoney(transaction.amount || 0)}
                  </td>
                  <td><span className="status-pill">{transaction.status || "Unknown"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon="receipt_long"
          title={unavailable ? "Transaction history unavailable" : "No ledger records in scope"}
          message={unavailable ? "The transaction list could not be loaded from the backend." : "There are no transactions to show for this range."}
        />
      )}

      <div className="card-footnote">
        <span>Showing up to 5 of the latest 100 API records</span>
        <span>Transfer records only</span>
      </div>
    </section>
  );
}
