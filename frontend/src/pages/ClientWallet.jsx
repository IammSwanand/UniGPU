import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useToasts } from '../components/client-dashboard/useToasts';
import ToastStack from '../components/client-dashboard/Toast';
import DashboardNavbar from '../components/client-dashboard/DashboardNavbar';
import WalletPanel from '../components/client-dashboard/WalletPanel';

export default function ClientWallet() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [topupAmt, setTopupAmt] = useState('');

  const { toasts, notify, dismiss } = useToasts();

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

  const handleTopup = useCallback(async () => {
    const amt = parseFloat(topupAmt);
    if (!amt || amt <= 0) return;
    try {
      await api.topUp(amt);
      setTopupAmt('');
      notify('Wallet updated.', 'success');
      await load();
    } catch (e) {
      notify(e.detail || 'Wallet update failed.', 'error');
    }
  }, [topupAmt, notify, load]);

  return (
    <div className="client-dashboard">
      <DashboardNavbar wallet={wallet} />

      <div className="cd-shell">
        <div style={{ marginBottom: '24px' }}>
          <Link
            to="/dashboard/client"
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
        <WalletPanel
          wallet={wallet}
          transactions={transactions}
          topupAmt={topupAmt}
          onTopupChange={setTopupAmt}
          onTopUp={handleTopup}
        />
      </div>

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
