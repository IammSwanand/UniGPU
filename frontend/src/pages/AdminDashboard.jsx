import { useState, useEffect } from 'react';
import api from '../api/client';
import AdminNavbar from '../components/admin-dashboard/AdminNavbar';
import { statusInfo, timeAgo } from '../components/client-dashboard/utils';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [gpus, setGPUs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('overview');
  const [overdraftLimit, setOverdraftLimit] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const { user, updateUser } = useAuth();
  
  const [twoFactorQR, setTwoFactorQR] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [settingUp2FA, setSettingUp2FA] = useState(false);

  // ── Disable 2FA ──
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disabling2FA, setDisabling2FA] = useState(false);

  // ── Agent Release Management ──
  const [agentFile, setAgentFile] = useState(null);
  const [agentVersion, setAgentVersion] = useState('');
  const [agentPatchNotes, setAgentPatchNotes] = useState('');
  const [uploadingAgent, setUploadingAgent] = useState(false);

  const load = async () => {
    try {
      const results = await Promise.allSettled([
        api.adminStats(), api.adminGPUs(), api.adminJobs(), api.adminUsers(), api.getSystemSettings()
      ]);
      const [s, g, j, u, st] = results.map(r => r.status === 'fulfilled' ? r.value : null);
      if (s) setStats(s);
      if (g) setGPUs(g);
      if (j) setJobs(j);
      if (u) setUsers(u);
      if (st) setOverdraftLimit(st.overdraft_limit?.toString() || '-50');
    } catch (e) { console.error(e); }
  };

  const handleToggleUser = async (userId) => {
    try {
      await api.toggleUserStatus(userId);
      const u = await api.adminUsers();
      setUsers(u);
    } catch (e) {
      console.error('Failed to toggle user status', e);
    }
  };

  const handleUnblockWallet = async (userId) => {
    if (!window.confirm("Are you sure you want to manually unblock this user's wallet? This will forgive any negative debt and reset their balance to 0.")) return;
    try {
      await api.unblockWallet(userId);
      alert("Wallet unblocked successfully.");
    } catch (e) {
      console.error('Failed to unblock wallet', e);
      alert(e.detail || "Failed to unblock wallet");
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      await api.updateSystemSettings({ overdraft_limit: parseInt(overdraftLimit) || -50 });
      alert("Settings saved successfully.");
    } catch (e) {
      console.error(e);
      alert(e.detail || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSetup2FA = async () => {
    try {
      setSettingUp2FA(true);
      const res = await api.setup2fa();
      setTwoFactorQR(res.qr_code);
    } catch (e) {
      alert("Failed to setup 2FA");
    } finally {
      setSettingUp2FA(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      await api.enable2fa({ code: twoFactorCode });
      alert("2FA successfully enabled!");
      updateUser({ is_2fa_enabled: true });
      setTwoFactorQR(null);
      setTwoFactorCode('');
    } catch (e) {
      alert(e.detail || "Failed to verify 2FA code");
      setTwoFactorCode('');
    }
  };

  const handleDisable2FA = async () => {
    try {
      setDisabling2FA(true);
      await api.disable2fa({ code: disableCode });
      alert("2FA has been disabled.");
      updateUser({ is_2fa_enabled: false });
      setShowDisable2FA(false);
      setDisableCode('');
    } catch (e) {
      alert(e.detail || "Failed to disable 2FA");
      setDisableCode('');
    } finally {
      setDisabling2FA(false);
    }
  };

  const handleAgentUpload = async () => {
    if (!agentFile || !agentVersion || !agentPatchNotes) {
      alert("Please fill in all fields (File, Version, Patch Notes).");
      return;
    }
    try {
      setUploadingAgent(true);
      const data = await api.uploadAgentRelease(agentFile, agentVersion, agentPatchNotes);
      alert(`Agent released successfully! URL: ${data.download_url}`);
      setAgentFile(null);
      setAgentVersion('');
      setAgentPatchNotes('');
      // clear file input
      const fileInput = document.getElementById('agentFileInput');
      if (fileInput) fileInput.value = null;
    } catch (e) {
      console.error(e);
      alert(e.detail || "Failed to upload agent release");
    } finally {
      setUploadingAgent(false);
    }
  };

  useEffect(() => { load(); }, []);

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'gpus', label: 'GPU Fleet' },
    { key: 'jobs', label: 'Jobs' },
    { key: 'users', label: 'Users' },
    { key: 'settings', label: 'System Settings' },
  ];

  const handleTab = (key) => setTab(key);

  return (
    <div className="client-dashboard">
      <AdminNavbar />
      
      <div className="cd-shell">
        <div className="cd-section-head">
          <div>
            <h1 className="cd-section-head__title">Admin Dashboard</h1>
            <p className="cd-section-head__desc">Platform overview and management.</p>
          </div>
        </div>

        {/* Toolbar: Tabs */}
        <div className="cd-toolbar" style={{ marginBottom: '24px' }}>
          <div className="cd-filter" role="tablist">
            {tabs.map(t => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                className={`cd-filter__btn ${tab === t.key ? 'cd-filter__btn--active' : ''}`}
                onClick={() => handleTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="cd-card" style={{ padding: '20px' }}>
                <div style={{ color: 'var(--lp-ash-helper)', fontSize: '13px', fontWeight: 500 }}>Total GPUs</div>
                <div style={{ fontSize: '32px', fontWeight: 600, marginTop: '8px' }}>{stats?.total_gpus ?? '-'}</div>
              </div>
              <div className="cd-card" style={{ padding: '20px' }}>
                <div style={{ color: 'var(--lp-ash-helper)', fontSize: '13px', fontWeight: 500 }}>Online GPUs</div>
                <div style={{ fontSize: '32px', fontWeight: 600, marginTop: '8px', color: '#10b981' }}>{stats?.online_gpus ?? '-'}</div>
              </div>
              <div className="cd-card" style={{ padding: '20px' }}>
                <div style={{ color: 'var(--lp-ash-helper)', fontSize: '13px', fontWeight: 500 }}>Total Jobs</div>
                <div style={{ fontSize: '32px', fontWeight: 600, marginTop: '8px', color: '#8b5cf6' }}>{stats?.total_jobs ?? '-'}</div>
              </div>
              <div className="cd-card" style={{ padding: '20px' }}>
                <div style={{ color: 'var(--lp-ash-helper)', fontSize: '13px', fontWeight: 500 }}>Total Users</div>
                <div style={{ fontSize: '32px', fontWeight: 600, marginTop: '8px', color: '#f59e0b' }}>{stats?.total_users ?? '-'}</div>
              </div>
            </div>



            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div className="cd-card">
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--lp-stone-divider)', fontWeight: 600 }}>Recent Jobs</div>
                <div className="cd-table__scroll" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--lp-stone-divider)', color: 'var(--lp-ash-helper)', fontSize: '12px', textTransform: 'uppercase' }}>
                        <th style={{ padding: '12px 20px', fontWeight: 600 }}>Job ID</th>
                        <th style={{ padding: '12px 20px', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '12px 20px', fontWeight: 600 }}>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.slice(0, 5).map(j => {
                        const si = statusInfo(j.status);
                        return (
                          <tr key={j.id} style={{ borderBottom: '1px solid var(--lp-stone-divider)', fontSize: '14px' }}>
                            <td style={{ padding: '12px 20px', fontFamily: 'var(--font-mono)' }}>{j.id.slice(0, 8)}...</td>
                            <td style={{ padding: '12px 20px' }}><span className={`cd-status ${si.cls}`}>{si.label}</span></td>
                            <td style={{ padding: '12px 20px', color: 'var(--lp-ash-helper)' }}>{timeAgo(j.created_at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="cd-card">
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--lp-stone-divider)', fontWeight: 600 }}>GPU Fleet Status</div>
                <div className="cd-table__scroll" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--lp-stone-divider)', color: 'var(--lp-ash-helper)', fontSize: '12px', textTransform: 'uppercase' }}>
                        <th style={{ padding: '12px 20px', fontWeight: 600 }}>GPU</th>
                        <th style={{ padding: '12px 20px', fontWeight: 600 }}>VRAM</th>
                        <th style={{ padding: '12px 20px', fontWeight: 600 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gpus.slice(0, 5).map(g => (
                        <tr key={g.id} style={{ borderBottom: '1px solid var(--lp-stone-divider)', fontSize: '14px' }}>
                          <td style={{ padding: '12px 20px', fontWeight: 500 }}>{g.name}</td>
                          <td style={{ padding: '12px 20px', color: 'var(--lp-ash-helper)' }}>{g.vram_mb} MB</td>
                          <td style={{ padding: '12px 20px' }}>
                            <span className={`cd-status ${g.status === 'online' ? 'cd-status--completed' : g.status === 'offline' ? 'cd-status--failed' : 'cd-status--running'}`}>
                              {g.status.charAt(0).toUpperCase() + g.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GPUs Tab */}
        {tab === 'gpus' && (
          <div className="cd-table">
            <div className="cd-table__scroll">
              <table>
                <thead>
                  <tr>
                    <th>GPU Name</th>
                    <th>VRAM</th>
                    <th>CUDA</th>
                    <th>Status</th>
                    <th>Last Heartbeat</th>
                  </tr>
                </thead>
                <tbody>
                  {gpus.map(g => (
                    <tr key={g.id}>
                      <td data-label="GPU Name" style={{ fontWeight: 500 }}>{g.name}</td>
                      <td data-label="VRAM" style={{ color: 'var(--lp-ash-helper)' }}>{g.vram_mb} MB</td>
                      <td data-label="CUDA" style={{ color: 'var(--lp-ash-helper)' }}>{g.cuda_version || '-'}</td>
                      <td data-label="Status">
                        <span className={`cd-status ${g.status === 'online' ? 'cd-status--completed' : g.status === 'offline' ? 'cd-status--failed' : 'cd-status--running'}`}>
                          {g.status.charAt(0).toUpperCase() + g.status.slice(1)}
                        </span>
                      </td>
                      <td data-label="Last Heartbeat" style={{ color: 'var(--lp-ash-helper)' }}>
                        {g.last_heartbeat ? new Date(g.last_heartbeat).toLocaleString() : 'Never'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {tab === 'jobs' && (
          <div className="cd-table">
            <div className="cd-table__scroll">
              <table>
                <thead>
                  <tr>
                    <th>Job ID</th>
                    <th>Client</th>
                    <th>GPU</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(j => {
                    const si = statusInfo(j.status);
                    return (
                      <tr key={j.id}>
                        <td data-label="Job ID" className="cd-table__mono">{j.id.slice(0, 8)}...</td>
                        <td data-label="Client" style={{ color: 'var(--lp-ash-helper)' }}>{j.client_id?.slice(0, 8) || '-'}...</td>
                        <td data-label="GPU" style={{ color: 'var(--lp-ash-helper)' }}>{j.gpu_id ? j.gpu_id.slice(0, 8) + '...' : 'Unassigned'}</td>
                        <td data-label="Status">
                          <span className={`cd-status ${si.cls}`}>{si.label}</span>
                        </td>
                        <td data-label="Created" style={{ color: 'var(--lp-ash-helper)' }}>{new Date(j.created_at).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="cd-table">
            <div className="cd-table__scroll">
              <table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td data-label="Username" style={{ fontWeight: 500 }}>{u.username}</td>
                      <td data-label="Email" style={{ color: 'var(--lp-ash-helper)' }}>{u.email}</td>
                      <td data-label="Role">
                        <span className={`cd-status cd-status--completed`} style={{ color: '#0ea5e9', backgroundColor: '#e0f2fe' }}>
                          {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                        </span>
                      </td>
                      <td data-label="Joined" style={{ color: 'var(--lp-ash-helper)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td data-label="Status">
                        <span className={`cd-status ${u.is_active ? 'cd-status--completed' : 'cd-status--failed'}`}>
                          {u.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td data-label="Actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          className={`cd-btn ${u.is_active ? 'cd-btn--danger' : 'cd-btn--primary'}`}
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          onClick={() => handleToggleUser(u.id)}
                        >
                          {u.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          className="cd-btn"
                          style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid var(--lp-stone-divider)' }}
                          onClick={() => handleUnblockWallet(u.id)}
                        >
                          Unblock Wallet
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          <div className="cd-card" style={{ padding: '20px', maxWidth: '600px' }}>
            <div style={{ fontWeight: 600, marginBottom: '16px' }}>System Settings</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '24px', borderBottom: '1px solid var(--lp-stone-divider)', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--lp-ash-helper)', marginBottom: '4px' }}>Global Overdraft Limit (Credits)</label>
                <input 
                  className="cd-input" 
                  type="number" 
                  value={overdraftLimit} 
                  onChange={e => setOverdraftLimit(e.target.value)} 
                  style={{ width: '200px' }}
                />
              </div>
              <button 
                className="cd-btn cd-btn--primary" 
                onClick={handleSaveSettings} 
                disabled={savingSettings}
                style={{ marginTop: '20px' }}
              >
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>

            <div style={{ fontWeight: 600, marginBottom: '16px' }}>Security Settings</div>
            <div>
              {user?.is_2fa_enabled ? (
                <>
                  <div style={{ color: 'var(--lp-emerald)', fontWeight: 500, marginBottom: '16px' }}>✓ 2FA is successfully enabled on your account.</div>
                  {!showDisable2FA ? (
                    <button
                      className="cd-btn"
                      onClick={() => setShowDisable2FA(true)}
                      style={{ fontSize: '13px', color: '#ef4444', borderColor: '#ef4444' }}
                    >
                      Disable 2FA
                    </button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--lp-stone-subtle)', padding: '16px', borderRadius: '8px' }}>
                      <p style={{ fontSize: '14px', margin: 0, color: '#ef4444', fontWeight: 500 }}>⚠ Enter your current authenticator code to confirm:</p>
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
                          onClick={() => { setShowDisable2FA(false); setDisableCode(''); }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p style={{ color: 'var(--lp-ash-helper)', fontSize: '14px', marginBottom: '16px' }}>Enable Two-Factor Authentication using an authenticator app (e.g. Google Authenticator, Authy).</p>
                  
                  {!twoFactorQR ? (
                    <button className="cd-btn" onClick={handleSetup2FA} disabled={settingUp2FA}>
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
                        <button className="cd-btn cd-btn--primary" onClick={handleEnable2FA} disabled={twoFactorCode.length !== 6}>
                          Verify & Enable
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={{ fontWeight: 600, marginBottom: '16px', marginTop: '32px' }}>Agent Release Management</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '24px' }}>
              <p style={{ color: 'var(--lp-ash-helper)', fontSize: '13px', margin: 0 }}>
                Upload a new version of the UniGPU Agent executable. This will update the public Download page instantly.
              </p>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--lp-ash-helper)', marginBottom: '4px' }}>Agent Executable (.exe)</label>
                <input 
                  id="agentFileInput"
                  type="file" 
                  accept=".exe"
                  onChange={e => setAgentFile(e.target.files[0])}
                  className="cd-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--lp-ash-helper)', marginBottom: '4px' }}>Version (e.g. v2.1.0)</label>
                <input 
                  type="text" 
                  value={agentVersion}
                  onChange={e => setAgentVersion(e.target.value)}
                  placeholder="v2.1.0"
                  className="cd-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--lp-ash-helper)', marginBottom: '4px' }}>Patch Notes (Markdown supported)</label>
                <textarea 
                  value={agentPatchNotes}
                  onChange={e => setAgentPatchNotes(e.target.value)}
                  placeholder="- Added new feature&#10;- Fixed a bug"
                  className="cd-input"
                  style={{ width: '100%', minHeight: '100px', resize: 'vertical' }}
                />
              </div>

              <button 
                className="cd-btn cd-btn--primary" 
                onClick={handleAgentUpload} 
                disabled={uploadingAgent}
                style={{ alignSelf: 'flex-start' }}
              >
                {uploadingAgent ? 'Uploading to Supabase...' : 'Publish Release'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

