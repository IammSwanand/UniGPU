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
  const [activities, setActivities] = useState([]);
  const [tab, setTab] = useState('overview');
  const [settingsTab, setSettingsTab] = useState('global');
  const [selectedGPU, setSelectedGPU] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserWallet, setSelectedUserWallet] = useState(null);
  const [loadingUserWallet, setLoadingUserWallet] = useState(false);
  const [overdraftLimit, setOverdraftLimit] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const { user, updateUser } = useAuth();

  const getJobName = (scriptPath) => {
    if (!scriptPath) return 'Unknown Job';
    const parts = scriptPath.split(/[/\\]/);
    return parts[parts.length - 1];
  };

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
        api.adminStats(), api.adminGPUs(), api.adminJobs(), api.adminUsers(), api.getSystemSettings(), api.adminActivities()
      ]);
      const [s, g, j, u, st, a] = results.map(r => r.status === 'fulfilled' ? r.value : null);
      if (s) setStats(s);
      if (g) setGPUs(g);
      if (j) setJobs(j);
      if (u) setUsers(u);
      if (st) setOverdraftLimit(st.overdraft_limit?.toString() || '-50');
      if (a) setActivities(a);
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

  const handleUserClick = async (u) => {
    setSelectedUser(u);
    setSelectedUserWallet(null);
    setLoadingUserWallet(true);
    try {
      const wallet = await api.adminGetUserWallet(u.id);
      setSelectedUserWallet(wallet);
    } catch (e) {
      console.error("Failed to load user wallet", e);
    } finally {
      setLoadingUserWallet(false);
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
    { key: 'audit_logs', label: 'Audit Logs' },
    { key: 'settings', label: 'System Settings' },
  ];

  const handleTab = (key) => setTab(key);

  const activeTabDetails = tabs.find(t => t.key === tab);
  let tabDesc = 'Platform overview and management.';
  switch (tab) {
    case 'gpus': tabDesc = 'Manage the fleet of compute nodes.'; break;
    case 'jobs': tabDesc = 'Monitor all platform workloads.'; break;
    case 'users': tabDesc = 'Manage platform users and roles.'; break;
    case 'audit_logs': tabDesc = 'System activity and audit trail.'; break;
    case 'settings': tabDesc = 'Configure global system parameters.'; break;
  }

  return (
    <div className="client-dashboard">
      <AdminNavbar tabs={tabs} activeTab={tab} onTabChange={handleTab} />

      <div className="cd-shell">
        <div className="cd-section-head">
          <div>
            <h1 className="cd-section-head__title">{activeTabDetails?.label || 'Admin Dashboard'}</h1>
            <p className="cd-section-head__desc">{tabDesc}</p>
          </div>
        </div>


        {/* Overview Tab */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="cd-card" style={{ padding: '20px 0' }}>
                <div style={{ color: 'var(--lp-ash-helper)', fontSize: '13px', fontWeight: 500 }}>Total GPUs</div>
                <div style={{ fontSize: '32px', fontWeight: 600, marginTop: '8px' }}>{stats?.total_gpus ?? '-'}</div>
              </div>
              <div className="cd-card" style={{ padding: '20px 0' }}>
                <div style={{ color: 'var(--lp-ash-helper)', fontSize: '13px', fontWeight: 500 }}>Online GPUs</div>
                <div style={{ fontSize: '32px', fontWeight: 600, marginTop: '8px', color: 'var(--lp-midnight-ink)' }}>{stats?.online_gpus ?? '-'}</div>
              </div>
              <div className="cd-card" style={{ padding: '20px 0' }}>
                <div style={{ color: 'var(--lp-ash-helper)', fontSize: '13px', fontWeight: 500 }}>Total Jobs</div>
                <div style={{ fontSize: '32px', fontWeight: 600, marginTop: '8px', color: 'var(--lp-midnight-ink)' }}>{stats?.total_jobs ?? '-'}</div>
              </div>
              <div className="cd-card" style={{ padding: '20px 0' }}>
                <div style={{ color: 'var(--lp-ash-helper)', fontSize: '13px', fontWeight: 500 }}>Total Users</div>
                <div style={{ fontSize: '32px', fontWeight: 600, marginTop: '8px', color: 'var(--lp-midnight-ink)' }}>{stats?.total_users ?? '-'}</div>
              </div>
            </div>



            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div className="cd-card">
                <div style={{ padding: '16px 0', borderBottom: '1px solid var(--lp-stone-divider)', fontWeight: 600 }}>Recent Jobs</div>
                <div className="cd-table__scroll" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--lp-stone-divider)', color: 'var(--lp-ash-helper)', fontSize: '12px', textTransform: 'uppercase' }}>
                        <th style={{ padding: '12px 20px 12px 0', fontWeight: 600 }}>Job ID</th>
                        <th style={{ padding: '12px 20px', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '12px 0', fontWeight: 600 }}>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.slice(0, 5).map(j => {
                        const si = statusInfo(j.status);
                        return (
                          <tr key={j.id} style={{ borderBottom: '1px solid var(--lp-stone-divider)', fontSize: '14px' }}>
                            <td style={{ padding: '12px 20px 12px 0', fontFamily: 'var(--font-mono)' }}>{j.id.slice(0, 8)}...</td>
                            <td style={{ padding: '12px 20px' }}><span className={`cd-status ${si.cls}`}>{si.label}</span></td>
                            <td style={{ padding: '12px 0', color: 'var(--lp-ash-helper)' }}>{timeAgo(j.created_at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="cd-card">
                <div style={{ padding: '16px 0', borderBottom: '1px solid var(--lp-stone-divider)', fontWeight: 600 }}>GPU Fleet Status</div>
                <div className="cd-table__scroll" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--lp-stone-divider)', color: 'var(--lp-ash-helper)', fontSize: '12px', textTransform: 'uppercase' }}>
                        <th style={{ padding: '12px 20px 12px 0', fontWeight: 600 }}>GPU</th>
                        <th style={{ padding: '12px 20px', fontWeight: 600 }}>VRAM</th>
                        <th style={{ padding: '12px 0', fontWeight: 600 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gpus.slice(0, 5).map(g => (
                        <tr key={g.id} style={{ borderBottom: '1px solid var(--lp-stone-divider)', fontSize: '14px' }}>
                          <td style={{ padding: '12px 20px 12px 0', fontWeight: 500 }}>{g.name}</td>
                          <td style={{ padding: '12px 20px', color: 'var(--lp-ash-helper)' }}>{g.vram_mb} MB</td>
                          <td style={{ padding: '12px 0' }}>
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
                    <th>Owner</th>
                    <th>VRAM</th>
                    <th>CUDA</th>
                    <th>Status</th>
                    <th>Last Heartbeat</th>
                  </tr>
                </thead>
                <tbody>
                  {gpus.map(g => {
                    const owner = users.find(u => u.id === g.provider_id);
                    return (
                      <tr key={g.id} onClick={() => setSelectedGPU(g)} style={{ cursor: 'pointer' }} className="cd-table__row-hover">
                        <td data-label="GPU Name" style={{ fontWeight: 500 }}>{g.name}</td>
                        <td data-label="Owner" style={{ color: 'var(--lp-ash-helper)' }}>{owner ? owner.username : '-'}</td>
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
                    );
                  })}
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
                    <th>Job Name</th>
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
                      <tr key={j.id} onClick={() => setSelectedJob(j)} style={{ cursor: 'pointer' }} className="cd-table__row-hover">
                        <td data-label="Job ID" className="cd-table__mono">{j.id.slice(0, 8)}...</td>
                        <td data-label="Job Name" style={{ fontWeight: 500 }}>{getJobName(j.script_path)}</td>
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
                    <tr key={u.id} onClick={() => handleUserClick(u)} style={{ cursor: 'pointer' }} className="cd-table__row-hover">
                      <td data-label="Username" style={{ fontWeight: 500 }}>{u.username}</td>
                      <td data-label="Email" style={{ color: 'var(--lp-ash-helper)' }}>{u.email}</td>
                      <td data-label="Role">
                        <span className="cd-status">
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
                          onClick={(e) => { e.stopPropagation(); handleToggleUser(u.id); }}
                        >
                          {u.is_active ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'audit_logs' && (
          <div className="cd-card">
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--lp-midnight-ink)', margin: '0 0 16px' }}>System Activity</h2>
            <div className="cd-table__scroll" style={{ maxHeight: '600px' }}>
              <table style={{ width: '100%', fontSize: '13px', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--lp-stone-divider)', color: 'var(--lp-ash-helper)', background: 'var(--lp-fog-surface)' }}>
                    <th style={{ padding: '12px', fontWeight: 500 }}>Time</th>
                    <th style={{ padding: '12px', fontWeight: 500 }}>User ID</th>
                    <th style={{ padding: '12px', fontWeight: 500 }}>Action</th>
                    <th style={{ padding: '12px', fontWeight: 500 }}>Description</th>
                    <th style={{ padding: '12px', fontWeight: 500 }}>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((act) => (
                    <tr key={act.id} style={{ borderBottom: '1px solid var(--lp-stone-divider)' }}>
                      <td style={{ padding: '12px', color: 'var(--lp-ash-helper)' }}>{new Date(act.timestamp).toLocaleString()}</td>
                      <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>{act.user_id ? act.user_id.slice(0, 8) : 'System'}</td>
                      <td style={{ padding: '12px', fontWeight: 500 }}>{act.action}</td>
                      <td style={{ padding: '12px' }}>{act.description}</td>
                      <td style={{ padding: '12px', fontFamily: 'var(--font-mono)', color: 'var(--lp-ash-helper)' }}>{act.ip_address || '-'}</td>
                    </tr>
                  ))}
                  {activities.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--lp-ash-helper)' }}>
                        No activities found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-start', marginTop: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px' }}>
              {[
                { id: 'global', label: 'Global Settings' },
                { id: 'security', label: 'Security' },
                { id: 'release', label: 'Agent Release' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setSettingsTab(t.id)}
                  style={{
                    textAlign: 'left',
                    background: settingsTab === t.id ? '#fff' : 'transparent',
                    border: settingsTab === t.id ? '1px solid var(--lp-stone-divider)' : '1px solid transparent',
                    boxShadow: settingsTab === t.id ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: settingsTab === t.id ? 600 : 500,
                    color: settingsTab === t.id ? 'var(--lp-midnight-ink)' : 'var(--lp-ash-helper)',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, maxWidth: '600px' }}>
              {/* 1. Global Settings */}
              {settingsTab === 'global' && (
                <div className="cd-card" style={{ padding: '24px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--lp-midnight-ink)', margin: '0 0 4px' }}>Global Settings</h2>
                  <p style={{ fontSize: '13px', color: 'var(--lp-slate-caption)', margin: '0 0 20px' }}>Manage platform-wide financial thresholds.</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--lp-ash-helper)', marginBottom: '6px' }}>Overdraft Limit (Credits)</label>
                      <input
                        className="cd-input"
                        type="number"
                        value={overdraftLimit}
                        onChange={e => setOverdraftLimit(e.target.value)}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <button
                      className="cd-btn cd-btn--primary"
                      onClick={handleSaveSettings}
                      disabled={savingSettings}
                      style={{ alignSelf: 'flex-start' }}
                    >
                      {savingSettings ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}

              {/* 2. Security Settings */}
              {settingsTab === 'security' && (
                <div className="cd-card" style={{ padding: '24px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--lp-midnight-ink)', margin: '0 0 4px' }}>Security</h2>
                  <p style={{ fontSize: '13px', color: 'var(--lp-slate-caption)', margin: '0 0 20px' }}>Enhance your admin account with 2FA.</p>

                  {user?.is_2fa_enabled ? (
                    <div style={{ background: 'var(--lp-fog-surface)', border: '1px solid var(--lp-stone-divider)', padding: '16px', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--lp-midnight-ink)', fontWeight: 500 }}>
                          2FA is enabled
                        </div>
                        {!showDisable2FA && (
                          <button
                            className="cd-btn"
                            onClick={() => setShowDisable2FA(true)}
                            style={{ fontSize: '13px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.15)' }}
                          >
                            Disable
                          </button>
                        )}
                      </div>

                      {showDisable2FA && (
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--lp-stone-divider)' }}>
                          <p style={{ fontSize: '13px', margin: '0 0 12px', color: 'var(--lp-ash-helper)' }}>Enter your authenticator code to confirm disable:</p>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <input
                              className="cd-input"
                              type="text"
                              inputMode="numeric"
                              placeholder="000000"
                              value={disableCode}
                              onChange={e => setDisableCode(e.target.value.replace(/\D/g, ''))}
                              style={{ width: '100px', textAlign: 'center', letterSpacing: '2px' }}
                              maxLength={6}
                            />
                            <button
                              className="cd-btn"
                              onClick={handleDisable2FA}
                              disabled={disableCode.length !== 6 || disabling2FA}
                              style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                            >
                              {disabling2FA ? '...' : 'Confirm'}
                            </button>
                            <button className="cd-btn cd-btn--outline" onClick={() => { setShowDisable2FA(false); setDisableCode(''); }}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ background: 'var(--lp-fog-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--lp-stone-divider)' }}>
                      {!twoFactorQR ? (
                        <div>
                          <p style={{ color: 'var(--lp-ash-helper)', fontSize: '13px', margin: '0 0 16px' }}>Protect your admin account using an authenticator app.</p>
                          <button className="cd-btn cd-btn--primary" onClick={handleSetup2FA} disabled={settingUp2FA}>
                            {settingUp2FA ? 'Generating QR...' : 'Setup 2FA'}
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <p style={{ fontSize: '13px', fontWeight: 500, margin: 0 }}>1. Scan this QR Code with your App</p>
                          <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', display: 'inline-block', alignSelf: 'flex-start', border: '1px solid var(--lp-stone-divider)' }}>
                            <img src={twoFactorQR} alt="2FA QR Code" style={{ width: '160px', height: '160px', display: 'block' }} />
                          </div>

                          <p style={{ fontSize: '13px', fontWeight: 500, margin: '8px 0 0' }}>2. Enter the 6-digit verification code</p>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              className="cd-input"
                              type="text"
                              inputMode="numeric"
                              placeholder="000000"
                              value={twoFactorCode}
                              onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                              style={{ width: '100px', textAlign: 'center', letterSpacing: '2px', fontSize: '16px' }}
                              maxLength={6}
                            />
                            <button className="cd-btn cd-btn--primary" onClick={handleEnable2FA} disabled={twoFactorCode.length !== 6}>
                              Verify
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Agent Release */}
              {settingsTab === 'release' && (
                <div className="cd-card" style={{ padding: '24px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--lp-midnight-ink)', margin: '0 0 4px' }}>Agent Release</h2>
                  <p style={{ fontSize: '13px', color: 'var(--lp-slate-caption)', margin: '0 0 20px' }}>Publish a new version of the UniGPU Agent.</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--lp-ash-helper)', marginBottom: '6px' }}>Agent Executable (.exe)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <label
                          htmlFor="agentFileInput"
                          className="cd-btn"
                          style={{ cursor: 'pointer', padding: '6px 12px', fontSize: '13px', background: 'var(--lp-fog-surface)' }}
                        >
                          Browse Files
                        </label>
                        <span style={{ fontSize: '13px', color: 'var(--lp-slate-caption)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {agentFile ? agentFile.name : 'No file chosen'}
                        </span>
                        <input
                          id="agentFileInput"
                          type="file"
                          accept=".exe"
                          onChange={e => setAgentFile(e.target.files[0])}
                          style={{ display: 'none' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--lp-ash-helper)', marginBottom: '6px' }}>Version (e.g. v0.1.x)</label>
                      <input
                        type="text"
                        value={agentVersion}
                        onChange={e => setAgentVersion(e.target.value)}
                        placeholder="v0.1.x"
                        className="cd-input"
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--lp-ash-helper)', marginBottom: '6px' }}>Patch Notes</label>
                      <textarea
                        value={agentPatchNotes}
                        onChange={e => setAgentPatchNotes(e.target.value)}
                        placeholder="- Added new feature&#10;- Fixed a bug"
                        className="cd-input"
                        style={{ width: '100%', minHeight: '100px', height: 'auto', padding: '12px 14px', resize: 'vertical', lineHeight: '1.5' }}
                      />
                    </div>

                    <button
                      className="cd-btn"
                      onClick={handleAgentUpload}
                      disabled={uploadingAgent}
                      style={{ alignSelf: 'flex-start', background: 'var(--lp-midnight-ink)', color: '#fff', border: 'none' }}
                    >
                      {uploadingAgent ? 'Publishing...' : 'Publish Release'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* GPU Details Modal */}
      {selectedGPU && (() => {
        const owner = users.find(u => u.id === selectedGPU.provider_id);
        const gpuJobs = jobs.filter(j => j.gpu_id === selectedGPU.id);
        
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--lp-stone-divider)', paddingBottom: '12px', marginBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--lp-midnight-ink)' }}>GPU Details</h2>
                <button className="cd-btn" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => setSelectedGPU(null)}>Close</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Left Column: Basic Info */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--lp-midnight-ink)', margin: '0 0 12px 0' }}>Specifications & Status</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px', fontSize: '13px', color: 'var(--lp-midnight-ink)', marginBottom: '24px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--lp-ash-helper)' }}>Name</div>
                    <div>{selectedGPU.name}</div>
                    
                    <div style={{ fontWeight: 600, color: 'var(--lp-ash-helper)' }}>ID</div>
                    <div style={{ fontFamily: 'var(--font-mono)' }}>{selectedGPU.id}</div>
                    
                    <div style={{ fontWeight: 600, color: 'var(--lp-ash-helper)' }}>Owner</div>
                    <div>
                      {owner ? (
                        <span>{owner.username} <span style={{ color: 'var(--lp-ash-helper)' }}>({owner.email})</span></span>
                      ) : (
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--lp-ash-helper)' }}>{selectedGPU.provider_id}</span>
                      )}
                    </div>
                    
                    <div style={{ fontWeight: 600, color: 'var(--lp-ash-helper)' }}>VRAM</div>
                    <div>{selectedGPU.vram_mb} MB</div>
                    
                    <div style={{ fontWeight: 600, color: 'var(--lp-ash-helper)' }}>CUDA</div>
                    <div>{selectedGPU.cuda_version || 'Unknown'}</div>
                    
                    <div style={{ fontWeight: 600, color: 'var(--lp-ash-helper)' }}>Status</div>
                    <div>
                      <span className={`cd-status ${selectedGPU.status === 'online' ? 'cd-status--completed' : selectedGPU.status === 'offline' ? 'cd-status--failed' : 'cd-status--running'}`}>
                         {selectedGPU.status.charAt(0).toUpperCase() + selectedGPU.status.slice(1)}
                      </span>
                    </div>
                    
                    <div style={{ fontWeight: 600, color: 'var(--lp-ash-helper)' }}>Heartbeat</div>
                    <div>{selectedGPU.last_heartbeat ? new Date(selectedGPU.last_heartbeat).toLocaleString() : 'Never'}</div>
                    
                    <div style={{ fontWeight: 600, color: 'var(--lp-ash-helper)' }}>Created At</div>
                    <div>{new Date(selectedGPU.created_at).toLocaleString()}</div>
                  </div>
                </div>

                {/* Right Column: Jobs */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--lp-midnight-ink)', margin: '0 0 12px 0' }}>Jobs Ran on this GPU ({gpuJobs.length})</h3>
                  <div className="cd-table__scroll" style={{ maxHeight: '300px', border: '1px solid var(--lp-stone-divider)', borderRadius: '6px' }}>
                    <table style={{ width: '100%', fontSize: '12px', textAlign: 'left', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--lp-stone-divider)', background: 'var(--lp-fog-surface)', color: 'var(--lp-ash-helper)' }}>
                          <th style={{ padding: '8px' }}>Job ID</th>
                          <th style={{ padding: '8px' }}>Status</th>
                          <th style={{ padding: '8px' }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gpuJobs.length > 0 ? gpuJobs.map(j => {
                          const si = statusInfo(j.status);
                          return (
                            <tr key={j.id} style={{ borderBottom: '1px solid var(--lp-stone-divider)' }}>
                              <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{j.id.slice(0, 8)}...</td>
                              <td style={{ padding: '8px' }}>
                                <span className={`cd-status ${si.cls}`} style={{ padding: '2px 6px', fontSize: '10px' }}>
                                  {si.label.toUpperCase()}
                                </span>
                              </td>
                              <td style={{ padding: '8px', color: 'var(--lp-ash-helper)' }}>{new Date(j.created_at).toLocaleDateString()}</td>
                            </tr>
                          );
                        }) : (
                          <tr><td colSpan="3" style={{ padding: '8px', textAlign: 'center', color: 'var(--lp-ash-helper)' }}>No jobs ran on this GPU</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Job Details Modal */}
      {selectedJob && (() => {
        const client = users.find(u => u.id === selectedJob.client_id);
        const jobGPU = gpus.find(g => g.id === selectedJob.gpu_id);
        const provider = jobGPU ? users.find(u => u.id === jobGPU.provider_id) : null;

        const formatDuration = (seconds) => {
          if (!seconds) return '-';
          if (seconds < 60) return `${seconds}s`;
          return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
        };

        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '600px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
              <h2 style={{ marginTop: 0, borderBottom: '1px solid var(--lp-stone-divider)', paddingBottom: '12px', marginBottom: '16px', fontSize: '18px', fontWeight: 600, color: 'var(--lp-midnight-ink)' }}>Job Details</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px', fontSize: '14px', color: 'var(--lp-midnight-ink)' }}>
                <div style={{ fontWeight: 600, color: 'var(--lp-ash-helper)' }}>Job Name</div>
                <div style={{ fontWeight: 500 }}>{getJobName(selectedJob.script_path)}</div>

                <div style={{ fontWeight: 600, color: 'var(--lp-ash-helper)' }}>Job ID</div>
                <div style={{ fontFamily: 'var(--font-mono)' }}>{selectedJob.id}</div>
                
                <div style={{ fontWeight: 600, color: 'var(--lp-ash-helper)' }}>Client</div>
                <div>{client ? <span>{client.username} <span style={{ color: 'var(--lp-ash-helper)' }}>({client.email})</span></span> : <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--lp-ash-helper)' }}>{selectedJob.client_id || 'Unknown'}</span>}</div>
                
                <div style={{ fontWeight: 600, color: 'var(--lp-ash-helper)' }}>Provider</div>
                <div>{provider ? <span>{provider.username} <span style={{ color: 'var(--lp-ash-helper)' }}>({provider.email})</span></span> : (jobGPU ? <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--lp-ash-helper)' }}>{jobGPU.provider_id}</span> : <span style={{ color: 'var(--lp-ash-helper)' }}>Unassigned</span>)}</div>
                
                <div style={{ fontWeight: 600, color: 'var(--lp-ash-helper)' }}>GPU Used</div>
                <div>{jobGPU ? <span>{jobGPU.name} <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--lp-ash-helper)' }}>({jobGPU.id.slice(0,8)}...)</span></span> : <span style={{ color: 'var(--lp-ash-helper)' }}>Unassigned</span>}</div>
                
                <div style={{ fontWeight: 600, color: 'var(--lp-ash-helper)' }}>Status</div>
                <div>
                  <span className={`cd-status ${statusInfo(selectedJob.status).cls}`}>
                     {statusInfo(selectedJob.status).label}
                  </span>
                </div>
                
                <div style={{ fontWeight: 600, color: 'var(--lp-ash-helper)' }}>Created At</div>
                <div>{new Date(selectedJob.created_at).toLocaleString()}</div>

                <div style={{ fontWeight: 600, color: 'var(--lp-ash-helper)' }}>Started At</div>
                <div>{selectedJob.started_at ? new Date(selectedJob.started_at).toLocaleString() : '-'}</div>

                <div style={{ fontWeight: 600, color: 'var(--lp-ash-helper)' }}>Ended At</div>
                <div>{selectedJob.completed_at ? new Date(selectedJob.completed_at).toLocaleString() : '-'}</div>

                <div style={{ fontWeight: 600, color: 'var(--lp-ash-helper)' }}>Total Time Taken</div>
                <div>{formatDuration(selectedJob.duration_seconds)}</div>

                <div style={{ fontWeight: 600, color: 'var(--lp-ash-helper)' }}>Credits Used</div>
                <div>{selectedJob.cost ? `${selectedJob.cost.toFixed(4)} Credits` : '-'}</div>
              </div>

              {selectedJob.status === 'failed' && selectedJob.logs && (
                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--lp-stone-divider)' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--lp-midnight-ink)', margin: '0 0 8px 0' }}>Failure Logs</h3>
                  <div style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '12px', borderRadius: '6px', fontSize: '12px', fontFamily: 'var(--font-mono)', maxHeight: '200px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                    {selectedJob.logs}
                  </div>
                </div>
              )}
              
              <div style={{ marginTop: '24px', textAlign: 'right' }}>
                <button className="cd-btn cd-btn--primary" onClick={() => setSelectedJob(null)}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* User Details Modal */}
      {selectedUser && (() => {
        const userGPUs = gpus.filter(g => g.provider_id === selectedUser.id);
        const userJobs = jobs.filter(j => j.client_id === selectedUser.id);

        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--lp-stone-divider)', paddingBottom: '12px', marginBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--lp-midnight-ink)' }}>User Details</h2>
                <button className="cd-btn" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => setSelectedUser(null)}>Close</button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Left Column: Basic Info & Wallet */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--lp-midnight-ink)', margin: '0 0 12px 0' }}>Profile</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px', fontSize: '13px', color: 'var(--lp-midnight-ink)', marginBottom: '24px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--lp-ash-helper)' }}>ID</div>
                    <div style={{ fontFamily: 'var(--font-mono)' }}>{selectedUser.id}</div>
                    
                    <div style={{ fontWeight: 600, color: 'var(--lp-ash-helper)' }}>Username</div>
                    <div>{selectedUser.username}</div>
                    
                    <div style={{ fontWeight: 600, color: 'var(--lp-ash-helper)' }}>Email</div>
                    <div>{selectedUser.email}</div>
                    
                    <div style={{ fontWeight: 600, color: 'var(--lp-ash-helper)' }}>Role</div>
                    <div><span className="cd-status">{selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}</span></div>
                    
                    <div style={{ fontWeight: 600, color: 'var(--lp-ash-helper)' }}>Status</div>
                    <div>
                      <span className={`cd-status ${selectedUser.is_active ? 'cd-status--completed' : 'cd-status--failed'}`}>
                        {selectedUser.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    
                    <div style={{ fontWeight: 600, color: 'var(--lp-ash-helper)' }}>Created At</div>
                    <div>{new Date(selectedUser.created_at).toLocaleString()}</div>
                  </div>

                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--lp-midnight-ink)', margin: '0 0 12px 0' }}>Wallet & Transactions</h3>
                  {loadingUserWallet ? (
                    <div style={{ fontSize: '13px', color: 'var(--lp-ash-helper)' }}>Loading wallet...</div>
                  ) : selectedUserWallet ? (
                    <div>
                      <div style={{ marginBottom: '12px', fontSize: '13px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--lp-ash-helper)' }}>Balance: </span> 
                        <span style={{ fontWeight: 600, color: 'var(--lp-midnight-ink)' }}>{selectedUserWallet.balance.toFixed(2)} Credits</span>
                      </div>
                      <div className="cd-table__scroll" style={{ maxHeight: '200px', border: '1px solid var(--lp-stone-divider)', borderRadius: '6px' }}>
                        <table style={{ width: '100%', fontSize: '12px', textAlign: 'left', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--lp-stone-divider)', background: 'var(--lp-fog-surface)', color: 'var(--lp-ash-helper)' }}>
                              <th style={{ padding: '8px' }}>Type</th>
                              <th style={{ padding: '8px' }}>Amount</th>
                              <th style={{ padding: '8px' }}>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedUserWallet.transactions.length > 0 ? selectedUserWallet.transactions.map(t => (
                              <tr key={t.id} style={{ borderBottom: '1px solid var(--lp-stone-divider)' }}>
                                <td style={{ padding: '8px' }}>
                                  <span className={`cd-status ${t.type === 'credit' ? 'cd-status--completed' : 'cd-status--failed'}`} style={{ padding: '2px 6px', fontSize: '10px' }}>
                                    {t.type.toUpperCase()}
                                  </span>
                                </td>
                                <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{t.amount > 0 ? '+' : ''}{t.amount}</td>
                                <td style={{ padding: '8px', color: 'var(--lp-ash-helper)' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                              </tr>
                            )) : (
                              <tr><td colSpan="3" style={{ padding: '8px', textAlign: 'center', color: 'var(--lp-ash-helper)' }}>No transactions</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '13px', color: 'var(--lp-ash-helper)' }}>No wallet data found.</div>
                  )}
                </div>

                {/* Right Column: GPUs & Jobs */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--lp-midnight-ink)', margin: '0 0 12px 0' }}>GPUs Owned ({userGPUs.length})</h3>
                  <div className="cd-table__scroll" style={{ maxHeight: '180px', border: '1px solid var(--lp-stone-divider)', borderRadius: '6px', marginBottom: '24px' }}>
                    <table style={{ width: '100%', fontSize: '12px', textAlign: 'left', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--lp-stone-divider)', background: 'var(--lp-fog-surface)', color: 'var(--lp-ash-helper)' }}>
                          <th style={{ padding: '8px' }}>GPU</th>
                          <th style={{ padding: '8px' }}>VRAM</th>
                          <th style={{ padding: '8px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userGPUs.length > 0 ? userGPUs.map(g => (
                          <tr key={g.id} style={{ borderBottom: '1px solid var(--lp-stone-divider)' }}>
                            <td style={{ padding: '8px', fontWeight: 500 }}>{g.name}</td>
                            <td style={{ padding: '8px' }}>{g.vram_mb} MB</td>
                            <td style={{ padding: '8px' }}>
                              <span className={`cd-status ${g.status === 'online' ? 'cd-status--completed' : g.status === 'offline' ? 'cd-status--failed' : 'cd-status--running'}`} style={{ padding: '2px 6px', fontSize: '10px' }}>
                                {g.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan="3" style={{ padding: '8px', textAlign: 'center', color: 'var(--lp-ash-helper)' }}>No GPUs registered</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--lp-midnight-ink)', margin: '0 0 12px 0' }}>Jobs Submitted ({userJobs.length})</h3>
                  <div className="cd-table__scroll" style={{ maxHeight: '200px', border: '1px solid var(--lp-stone-divider)', borderRadius: '6px' }}>
                    <table style={{ width: '100%', fontSize: '12px', textAlign: 'left', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--lp-stone-divider)', background: 'var(--lp-fog-surface)', color: 'var(--lp-ash-helper)' }}>
                          <th style={{ padding: '8px' }}>Job ID</th>
                          <th style={{ padding: '8px' }}>Status</th>
                          <th style={{ padding: '8px' }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userJobs.length > 0 ? userJobs.map(j => {
                          const si = statusInfo(j.status);
                          return (
                            <tr key={j.id} style={{ borderBottom: '1px solid var(--lp-stone-divider)' }}>
                              <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{j.id.slice(0, 8)}...</td>
                              <td style={{ padding: '8px' }}>
                                <span className={`cd-status ${si.cls}`} style={{ padding: '2px 6px', fontSize: '10px' }}>
                                  {si.label.toUpperCase()}
                                </span>
                              </td>
                              <td style={{ padding: '8px', color: 'var(--lp-ash-helper)' }}>{new Date(j.created_at).toLocaleDateString()}</td>
                            </tr>
                          );
                        }) : (
                          <tr><td colSpan="3" style={{ padding: '8px', textAlign: 'center', color: 'var(--lp-ash-helper)' }}>No jobs submitted</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

