import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useToasts } from '../components/client-dashboard/useToasts';
import ToastStack from '../components/client-dashboard/Toast';
import ProviderNavbar from '../components/provider-dashboard/ProviderNavbar';

function ProviderWalletPanel({ wallet, transactions }) {
  return (
    <section id="wallet" aria-label="Wallet">
      <div className="cd-section-head">
        <div>
          <h2 className="cd-section-head__title">Provider Wallet</h2>
          <p className="cd-section-head__desc">
            Monitor your earnings from executed workloads.
          </p>
        </div>
      </div>

      <div className="cd-wallet">
        {/* Header with gradient + big balance */}
        <div className="cd-wallet__top" style={{ paddingBottom: '32px' }}>
          <div className="cd-wallet__label">Available Credits</div>
          <div className="cd-wallet__balance">
            <span className="cd-wallet__currency">₹</span>
            <span className="cd-wallet__amount">
              {wallet?.balance?.toFixed(2) ?? '0.00'}
            </span>
          </div>
        </div>

        {/* Transactions */}
        <div className="cd-wallet__body">
          <p className="cd-wallet__subhead">Recent Transactions</p>
          {transactions.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--lp-ash-helper)', fontSize: 14 }}>
              No transactions yet. Credits will appear here after your GPUs successfully execute workloads.
            </div>
          ) : (
            transactions.map((tx) => (
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

export default function ProviderWallet() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const { toasts, dismiss } = useToasts();

  const load = useCallback(async () => {
    try {
      const [w, t] = await Promise.all([
        api.getWallet(), api.getTransactions()
      ]);
      setWallet(w);
      setTransactions(t);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, [load]);

  return (
    <div className="client-dashboard">
      <ProviderNavbar wallet={wallet} />

      <div className="cd-shell">
        <div style={{ marginBottom: '24px' }}>
          <Link
            to="/dashboard/provider"
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              textDecoration: 'none', 
              color: 'var(--lp-midnight-ink)', 
              fontWeight: 500,
              fontSize: '15px'
            }}
          >
            &larr; Back to Dashboard
          </Link>
        </div>
        
        <ProviderWalletPanel
          wallet={wallet}
          transactions={transactions}
        />
      </div>

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
