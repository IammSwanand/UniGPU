import { useState, useEffect } from 'react';
import api from '../api/client';
import AdminNavbar from '../components/admin-dashboard/AdminNavbar';
import { statusInfo, timeAgo } from '../components/client-dashboard/utils';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [gpus, setGPUs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('overview');

  const load = async () => {
    try {
      const [s, g, j, u] = await Promise.all([
        api.adminStats(), api.adminGPUs(), api.adminJobs(), api.adminUsers(),
      ]);
      setStats(s);
      setGPUs(g);
      setJobs(j);
      setUsers(u);
    } catch (e) { console.error(e); }
  };

  const handleToggleUser = async (userId) => {
    try {
      await api.toggleUserStatus(userId);
      // Reload users to get updated status
      const u = await api.adminUsers();
      setUsers(u);
    } catch (e) {
      console.error('Failed to toggle user status', e);
    }
  };

  useEffect(() => { load(); }, []);

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'gpus', label: 'GPU Fleet' },
    { key: 'jobs', label: 'Jobs' },
    { key: 'users', label: 'Users' },
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
                      <td data-label="Actions">
                        <button
                          className={`cd-btn ${u.is_active ? 'cd-btn--danger' : 'cd-btn--primary'}`}
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          onClick={() => handleToggleUser(u.id)}
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

      </div>
    </div>
  );
}

