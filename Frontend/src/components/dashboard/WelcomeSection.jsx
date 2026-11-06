export default function WelcomeSection({ user, onAddTransaction }) {
  const firstName = user?.name?.split(" ")?.[0] || "Ledgerly user";

  return (
    <section className="welcome-row">
      <div>
        <div className="welcome-title-line">
          <h1>Good morning, {firstName}</h1>
          <span>L-0 Node</span>
        </div>
        <p>Here's what's happening with your high-capital ledger and operational accounts.</p>
      </div>
      <div className="welcome-actions">
        <div className="node-status">
          <span className="node-dot" />
          <div>
            <span>API status</span>
            <strong>Connected <em>session verified</em></strong>
          </div>
        </div>
        <button className="add-transaction-button" type="button" onClick={onAddTransaction}>
          <span className="material-symbols-outlined" aria-hidden="true">add</span>
          Add Transaction
        </button>
      </div>
    </section>
  );
}
