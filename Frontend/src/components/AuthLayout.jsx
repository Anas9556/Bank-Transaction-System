import { Link } from "react-router-dom";

function LoginVisual() {
  return (
    <>
      <div className="ledger-card login-ledger">
        <div className="ledger-topline" />
        <div className="ledger-header">
          <span className="status-dot" />
          <span>Ledger workspace</span>
          <span className="ledger-latency">Account data loads after sign-in</span>
        </div>
        <div className="balance-panel">
          <div className="panel-row">
            <span>Account overview</span>
            <strong>API DATA</strong>
          </div>
          <div className="balance-row">
            <b>Available after sign-in</b>
          </div>
          <p>Balances are read from your ledger accounts.</p>
        </div>
        <div className="sparkline-header">
          <span>Ledger activity illustration</span>
          <strong>Preview only</strong>
        </div>
        <svg className="sparkline" viewBox="0 0 300 42" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 30 L25 27 L50 29 L75 18 L100 22 L125 14 L150 19 L175 10 L200 15 L225 8 L250 12 L275 5 L300 8" />
          <path className="spark-dash" d="M0 34 L25 31 L50 33 L75 25 L100 29 L125 21 L150 26 L175 20 L200 24 L225 17 L250 20 L275 15 L300 18" />
        </svg>
      </div>
      <div className="trust-grid">
        <div>
          <span className="material-symbols-outlined">account_balance</span>
          <b>Ledger balances</b>
          <small>Calculated by the backend</small>
        </div>
        <div>
          <span className="material-symbols-outlined secondary">receipt_long</span>
          <b>Transfer history</b>
          <small>Recent account activity</small>
        </div>
        <div>
          <span className="material-symbols-outlined">lock</span>
          <b>Account access</b>
          <small>JWT cookie session</small>
        </div>
      </div>
    </>
  );
}

function RegisterVisual() {
  return (
    <>
      <div className="ledger-card register-ledger">
        <div className="register-telemetry-head">
          <span><span className="material-symbols-outlined">account_balance</span> Workspace preview</span>
          <strong>Data loads after sign-in</strong>
        </div>
        <div className="vault-row">
          <div className="vault-icon"><span className="material-symbols-outlined">account_balance_wallet</span></div>
          <div>
            <small>Account balances</small>
            <b>Read from your ledger</b>
          </div>
        </div>
        <div className="stream-box">
          <svg viewBox="0 0 380 80" preserveAspectRatio="none" aria-hidden="true">
            <line x1="0" x2="380" y1="40" y2="40" />
            <line x1="120" x2="120" y1="0" y2="80" />
            <line x1="260" x2="260" y1="0" y2="80" />
            <path className="stream-blue" d="M 0 58 Q 60 10, 120 40 T 240 26 T 380 54" />
            <path className="stream-teal" d="M 0 20 Q 70 54, 140 40 T 280 56 T 380 22" />
            <circle cx="120" cy="40" r="5" />
            <circle className="node-teal" cx="260" cy="32" r="5" />
            <circle className="node-teal" cx="340" cy="48" r="4" />
          </svg>
        </div>
        <div className="telemetry-grid">
          <div><small>Account data</small><b>Available after sign-in</b></div>
          <div><small>Transfer history</small><b>Latest API records</b></div>
        </div>
      </div>
      <div className="benefit-list">
        <div><span className="material-symbols-outlined">account_tree</span><b>Organized accounts</b><p>Review your accounts and balances in one workspace.</p></div>
        <div><span className="material-symbols-outlined secondary">history_edu</span><b>Transfer history</b><p>Browse the latest transfer records associated with your accounts.</p></div>
        <div><span className="material-symbols-outlined">insights</span><b>Clear account overview</b><p>See account balances and recent ledger activity together.</p></div>
      </div>
    </>
  );
}

export default function AuthLayout({ mode, children }) {
  const isRegister = mode === "register";

  return (
    <div className={`auth-page ${isRegister ? "register-page" : "login-page"}`}>
      <main className="auth-main">
        <section className="auth-left" aria-label="Ledgerly platform summary">
          <header className={isRegister ? "brand-header split" : "brand-header"}>
            <div className="brand-identity">
              <div className="brand-copy">
                <span className="brand-name">Ledgerly</span>
                {isRegister ? <span className="brand-subtitle">Financial Workspace</span> : null}
              </div>
              {!isRegister ? <span className="version-badge">Financial Workspace</span> : null}
            </div>
            {isRegister ? <span className="version-badge live"><span />Ledgerly</span> : null}
          </header>
          <div className="hero-copy">
            <h1>{isRegister ? "Build a clearer picture of your money." : <>Your finances.<br /><span>Clear by design.</span></>}</h1>
            <p>{isRegister ? "Create your workspace to organize financial activity and gain better visibility into your transactions." : "A smarter way to track transactions, understand your money, and maintain a transparent financial record."}</p>
          </div>
          {isRegister ? <RegisterVisual /> : <LoginVisual />}
        </section>
        <section className="auth-right" aria-label={isRegister ? "Register form" : "Login form"}>
          {children}
        </section>
      </main>
      <footer className="auth-footer">
        <div>
          <span className="status-dot" />
          <strong>Ledgerly account workspace</strong>
          <span>&bull;</span>
          <span>Authentication via API</span>
        </div>
        <div>
          <span>Account and transfer data is supplied by the Ledgerly backend.</span>
          <span className="footer-seal"><span className="material-symbols-outlined">verified_user</span>JWT cookie session</span>
        </div>
      </footer>
    </div>
  );
}
