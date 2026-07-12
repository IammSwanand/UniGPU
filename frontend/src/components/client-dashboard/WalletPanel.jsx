import { IconWallet } from './icons';

/**
 * WalletPanel — restyled wallet section for the light dashboard.
 *
 * Shows the wallet balance (big number with lavender gradient header),
 * a top-up input + button, and recent transactions (credit/debit colored).
 * The ID anchor `#wallet` is targeted by the navbar wallet pill's scroll.
 *
 * Per docs/client-db-content.md § Wallet Pill / docs/client-db-design.md:
 * "Small pill. Never a card." in the nav; here the wallet section gets its
 * own dedicated space with the full balance, top-up, and transaction list.
 *
 * Props:
 *  - wallet       : WalletOut | null
 *  - transactions : TransactionOut[]
 *  - topupAmt     : string (current input value)
 *  - onTopupChange(v) : update the amount input
 *  - onTopUp()       : execute the top-up
 */
export default function WalletPanel({
  wallet, transactions, topupAmt, onTopupChange, onTopUp,
}) {
  return (
    <section id="wallet" aria-label="Wallet">
      <div className="cd-section-head">
        <div>
          <h2 className="cd-section-head__title">Wallet</h2>
          <p className="cd-section-head__desc">
            Manage your credits for workload execution.
          </p>
        </div>
      </div>

      <div className="cd-wallet">
        {/* Header with gradient + big balance */}
        <div className="cd-wallet__top">
          <div className="cd-wallet__label">Available Credits</div>
          <div className="cd-wallet__balance">
            <span className="cd-wallet__currency">₹</span>
            <span className="cd-wallet__amount">
              {wallet?.balance?.toFixed(2) ?? '0.00'}
            </span>
          </div>
          <div className="cd-wallet__row">
            <input
              className="cd-input"
              type="number"
              placeholder="Amount"
              min="1"
              max="10000"
              step="any"
              value={topupAmt}
              onChange={(e) => onTopupChange(e.target.value)}
              aria-label="Top-up amount"
            />
            <button
              className="cd-btn cd-btn--primary"
              style={{ flex: 'none', padding: '12px 20px' }}
              onClick={onTopUp}
              disabled={!topupAmt || parseFloat(topupAmt) <= 0}
            >
              <IconWallet /> Top Up
            </button>
          </div>
        </div>

        {/* Transactions */}
        <div className="cd-wallet__body">
          <p className="cd-wallet__subhead">Recent Transactions</p>
          {transactions.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--lp-ash-helper)', fontSize: 14 }}>
              No transactions yet. Credits will appear here after your first top-up or workload execution.
            </div>
          ) : (
            transactions.slice(0, 10).map((tx) => (
              <div key={tx.id} className="cd-tx">
                <div>
                  <div className="cd-tx__type">{tx.type}</div>
                  <div className="cd-tx__date">
                    {new Date(tx.created_at).toLocaleString()}
                  </div>
                </div>
                <div className={`cd-tx__amount cd-tx__amount--${tx.type}`}>
                  {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
