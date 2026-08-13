import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import DashboardNavbar from '../components/client-dashboard/DashboardNavbar';
import ProviderNavbar from '../components/provider-dashboard/ProviderNavbar';
import { useToasts } from '../components/client-dashboard/useToasts';
import ToastStack from '../components/client-dashboard/Toast';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [wallet, setWallet] = useState(null);
  const { toasts, notify, dismiss } = useToasts();
  
  const [twoFactorQR, setTwoFactorQR] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [settingUp2FA, setSettingUp2FA] = useState(false);

  // ── Disable 2FA ──
  const [showDisable, setShowDisable] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disabling2FA, setDisabling2FA] = useState(false);

  useEffect(() => {
    const loadWallet = async () => {
      try {
        const w = await api.getWallet();
        setWallet(w);
      } catch (e) {
        console.error("Failed to load wallet", e);
      }
    };
    if (user) {
      loadWallet();
    }
  }, [user]);

  const role = user?.role;
  const dashboardPath = role === 'client' ? '/dashboard/client'
    : role === 'provider' ? '/dashboard/provider'
    : '/dashboard';

  const renderNavbar = () => {
    if (role === 'provider') return <ProviderNavbar wallet={wallet} />;
    return <DashboardNavbar wallet={wallet} />;
  };

  const handleSetup2FA = async () => {
    try {
      setSettingUp2FA(true);
      const res = await api.setup2fa();
      setTwoFactorQR(res.qr_code);
    } catch (e) {
      notify(e.detail || "Failed to setup 2FA", "error");
    } finally {
      setSettingUp2FA(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      await api.enable2fa({ code: twoFactorCode });
      notify("2FA successfully enabled!", "success");
      updateUser({ is_2fa_enabled: true });
      setTwoFactorQR(null);
      setTwoFactorCode('');
    } catch (e) {
      notify(e.detail || "Failed to verify 2FA code", "error");
      setTwoFactorCode('');
    }
  };

  const handleDisable2FA = async () => {
    try {
      setDisabling2FA(true);
      await api.disable2fa({ code: disableCode });
      notify("2FA has been disabled.", "success");
      updateUser({ is_2fa_enabled: false });
      setShowDisable(false);
      setDisableCode('');
    } catch (e) {
      notify(e.detail || "Failed to disable 2FA", "error");
      setDisableCode('');
    } finally {
      setDisabling2FA(false);
    }
  };

  return (
    <div className="client-dashboard">
      {renderNavbar()}

      <div className="cd-shell">
        <div style={{ marginBottom: '24px' }}>
          <Link
            to={dashboardPath}
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

        <div style={{ paddingBottom: '24px', borderBottom: '1px solid var(--lp-stone-divider)' }}>
          <h1 className="cd-section-head__title">Settings</h1>
          <p className="cd-section-head__desc">Manage your account security and preferences.</p>
        </div>

        <div style={{ marginTop: '32px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          
          <div className="cd-panel" style={{ flex: '1 1 300px', maxWidth: '600px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>Two-Factor Authentication</h3>
            <p style={{ color: 'var(--lp-ash-helper)', fontSize: '14px', marginBottom: '20px' }}>
              Add an extra layer of security using an authenticator app (e.g. Google Authenticator, Authy).
            </p>

            {user?.is_2fa_enabled ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <span style={{ color: 'var(--lp-emerald)', fontWeight: 600, fontSize: '15px' }}>✓ 2FA is enabled</span>
                </div>

                {!showDisable ? (
                  <button
                    className="cd-btn"
                    onClick={() => setShowDisable(true)}
                    style={{ fontSize: '13px', color: '#ef4444', borderColor: '#ef4444' }}
                  >
                    Disable 2FA
                  </button>
                ) : (
                  <div style={{ background: 'var(--lp-stone-subtle)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <p style={{ fontSize: '14px', margin: 0, color: '#ef4444', fontWeight: 500 }}>
                      ⚠ Enter your current authenticator code to confirm:
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <input
                        className="cd-input"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="000000"
                        value={disableCode}
                        onChange={e => setDisableCode(e.target.value.replace(/\D/g, ''))}
                        style={{ width: '120px' }}
                        maxLength={6}
                      />
                      <button
                        className="cd-btn"
                        onClick={handleDisable2FA}
                        disabled={disableCode.length !== 6 || disabling2FA}
                        style={{ color: '#ef4444', borderColor: '#ef4444' }}
                      >
                        {disabling2FA ? 'Disabling...' : 'Confirm Disable'}
                      </button>
                      <button
                        className="cd-btn cd-btn--outline"
                        onClick={() => { setShowDisable(false); setDisableCode(''); }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {!twoFactorQR ? (
                  <button className="cd-btn cd-btn--primary" onClick={handleSetup2FA} disabled={settingUp2FA}>
                    {settingUp2FA ? 'Generating...' : 'Setup 2FA'}
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--lp-stone-subtle)', padding: '16px', borderRadius: '8px' }}>
                    <p style={{ fontSize: '14px', margin: 0 }}>1. Scan this QR Code with your Authenticator App:</p>
                    <img src={twoFactorQR} alt="2FA QR Code" style={{ width: '200px', height: '200px', borderRadius: '8px', background: '#fff', padding: '8px' }} />
                    <p style={{ fontSize: '14px', margin: 0 }}>2. Enter the 6-digit code to verify:</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        className="cd-input"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="000000"
                        value={twoFactorCode}
                        onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                        style={{ width: '120px' }}
                        maxLength={6}
                      />
                      <button
                        className="cd-btn cd-btn--primary"
                        onClick={handleEnable2FA}
                        disabled={twoFactorCode.length !== 6}
                      >
                        Verify & Enable
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

        </div>

      </div>
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
