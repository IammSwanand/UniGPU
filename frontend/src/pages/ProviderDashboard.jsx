import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { useToasts } from '../components/client-dashboard/useToasts';
import { useJobNotifications } from '../components/client-dashboard/useJobNotifications';
import ToastStack from '../components/client-dashboard/Toast';

import ProviderNavbar from '../components/provider-dashboard/ProviderNavbar';
import ConnectionPipeline from '../components/provider-dashboard/ConnectionPipeline';
import SystemMetrics from '../components/provider-dashboard/SystemMetrics';
import MyGPUs from '../components/provider-dashboard/MyGPUs';
import GpuDetailDrawer from '../components/provider-dashboard/GpuDetailDrawer';

import ProviderWorkloads from '../components/provider-dashboard/ProviderWorkloads';
import WorkloadDrawer from '../components/client-dashboard/WorkloadDrawer';
import LogsViewer from '../components/client-dashboard/LogsViewer';
import ConfirmDialog from '../components/client-dashboard/ConfirmDialog';

const WS_ENV = import.meta.env.VITE_WS_BASE_URL;
const WS_BASE_RAW = WS_ENV && WS_ENV.length > 0
    ? WS_ENV
    : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;
const WS_BASE = WS_BASE_RAW.replace(/\/+$/, '');

export default function ProviderDashboard() {
  const { user, token } = useAuth();
  
  const [gpus, setGPUs] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [jobs, setJobs] = useState([]);

  // Live data from WebSocket
  const [metrics, setMetrics] = useState({});
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);
  
  // UI states
  const [showRegister, setShowRegister] = useState(false);
  const [form, setForm] = useState({ name: '', vram_mb: '', cuda_version: '' });
  const [selectedGpuDetails, setSelectedGpuDetails] = useState(null);

  // Client components states
  const [logModal, setLogModal] = useState(null);
  const [logs, setLogs] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);
  const [drawerJob, setDrawerJob] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const { toasts, notify, dismiss } = useToasts();
  const { notifications, unreadCount, markAllRead } = useJobNotifications(jobs, notify);

  const load = useCallback(async () => {
    try {
      const [g, w, j] = await Promise.all([
        api.listGPUs(), 
        api.getWallet(), 
        api.listJobs()
      ]);
      setGPUs(g);
      setWallet(w);
      setJobs(j);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user?.id || !token) return;

    let ws;
    let reconnectTimer;

    const connect = () => {
      ws = new WebSocket(`${WS_BASE}/ws/provider/${user.id}?token=${encodeURIComponent(token)}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        notify('Backend connected', 'success');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'metrics') {
            setMetrics(prev => ({ ...prev, [msg.gpu_id]: msg.data }));
          } else if (msg.type === 'job_status' || msg.type === 'agent_status') {
            if (msg.status === 'disconnected') {
                setMetrics(prev => { const next = { ...prev }; delete next[msg.gpu_id]; return next; });
            }
            load();
          }
        } catch (err) {}
      };

      ws.onclose = () => {
        setWsConnected(false);
        notify('Backend disconnected. Reconnecting...', 'error');
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => { ws.close(); };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [user?.id, token, notify, load]);

  const handleRegisterGPU = async () => {
    try {
      await api.registerGPU({
        name: form.name,
        vram_mb: parseInt(form.vram_mb),
        cuda_version: form.cuda_version,
      });
      setShowRegister(false);
      setForm({ name: '', vram_mb: '', cuda_version: '' });
      notify('GPU Registered successfully', 'success');
      await load();
    } catch (e) { notify(e.detail || 'Registration failed', 'error'); }
  };

  const toggleStatus = async (gpu) => {
    const newStatus = gpu.status === 'online' ? 'offline' : 'online';
    try {
      if (newStatus === 'offline') {
        setMetrics(prev => { const next = { ...prev }; delete next[gpu.id]; return next; });
      }
      await api.updateGPU(gpu.id, { status: newStatus });
      notify(`GPU status changed to ${newStatus}`, 'success');
      await load();
    } catch (e) {
      notify(e.detail || 'Update failed', 'error');
    }
  };

  const activeGpuId = gpus.find(g => g.status === 'online' || g.status === 'busy')?.id;
  const liveMetrics = activeGpuId ? metrics[activeGpuId] : null;
  const agentConnected = !!liveMetrics;
  const dockerHealthy = agentConnected && liveMetrics.docker_running === true;

  const gpuNameFor = useCallback((id) => {
    if (!id) return 'Auto (Any)';
    const g = gpus.find((x) => x.id === id);
    return g ? g.name : id.slice(0, 8);
  }, [gpus]);

  const handleViewLogs = async (jobId) => {
    setLogModal(jobId);
    setLogsLoading(true);
    try {
      const data = await api.getJobLogs(jobId);
      setLogs(data.logs || '');
    } catch (e) {
      setLogs(`Error fetching logs: ${e.detail || e}`);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleStopJob = (job) => {
    setConfirm({
      title: 'Stop Workload?',
      msg: 'This cannot be undone. Are you sure you want to stop this workload?',
      confirmLabel: 'Stop Workload',
      danger: true,
      onOk: async () => {
        try {
          await api.cancelJob(job.id);
          notify('Workload stopped.', 'success');
          load();
        } catch (e) { notify(e.detail || 'Could not stop workload.', 'error'); }
      },
    });
  };

  return (
    <div className="client-dashboard">
      <ProviderNavbar 
        wallet={wallet}
        notifications={notifications}
        unreadCount={unreadCount}
        markAllRead={markAllRead}
      />
      
      <div className="cd-shell">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: '16px', borderBottom: '1px solid var(--lp-stone-divider)' }}>
          <div>
            <h1 className="cd-section-head__title">Overview</h1>
            <p className="cd-section-head__desc">Your provider node is connected and ready.</p>
          </div>
          <ConnectionPipeline 
            wsConnected={wsConnected} 
            agentConnected={agentConnected} 
            dockerHealthy={dockerHealthy} 
          />
        </div>

        <SystemMetrics liveMetrics={liveMetrics} />

        <MyGPUs 
          gpus={gpus} 
          metrics={metrics} 
          onToggleStatus={toggleStatus} 
          onRegisterClick={() => setShowRegister(true)} 
          onSelectGpu={setSelectedGpuDetails} 
        />

        <div style={{ marginTop: '32px' }}>
          <ProviderWorkloads 
            jobs={jobs}
            gpuNameFor={gpuNameFor}
            onViewLogs={handleViewLogs}
            onStop={handleStopJob}
            onSelectJob={setDrawerJob}
          />
        </div>
      </div>

      {showRegister && (
        <div className="cd-overlay" onClick={() => setShowRegister(false)} role="dialog">
            <div className="cd-modal__panel" style={{ position: 'relative', margin: 'auto', padding: '24px', maxWidth: '400px', width: '100%' }} onClick={e => e.stopPropagation()}>
                <h3 className="cd-modal__title" style={{ marginBottom: '16px' }}>Register New GPU</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                        <label className="cd-detail-row__label">GPU Name</label>
                        <input className="cd-input" style={{ width: '100%', marginTop: '4px' }} placeholder="e.g. RTX 4090"
                            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="cd-detail-row__label">VRAM (MB)</label>
                        <input className="cd-input" style={{ width: '100%', marginTop: '4px' }} type="number" placeholder="e.g. 24576"
                            value={form.vram_mb} onChange={e => setForm({ ...form, vram_mb: e.target.value })} />
                    </div>
                    <div>
                        <label className="cd-detail-row__label">CUDA Version</label>
                        <input className="cd-input" style={{ width: '100%', marginTop: '4px' }} placeholder="e.g. 12.3"
                            value={form.cuda_version} onChange={e => setForm({ ...form, cuda_version: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                        <button className="cd-btn cd-btn--outline" onClick={() => setShowRegister(false)}>Cancel</button>
                        <button className="cd-btn cd-btn--primary" onClick={handleRegisterGPU}>Register GPU</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {selectedGpuDetails && (
        <GpuDetailDrawer 
          gpu={selectedGpuDetails} 
          metrics={metrics[selectedGpuDetails.id]} 
          activeJob={jobs.find(j => j.gpu_id === selectedGpuDetails.id && (j.status === 'running' || j.status === 'queued' || j.status === 'pending'))}
          onClose={() => setSelectedGpuDetails(null)} 
        />
      )}

      {drawerJob && (
        <WorkloadDrawer
          job={drawerJob}
          availableGPUs={gpus}
          isProvider={true}
          onClose={() => setDrawerJob(null)}
        />
      )}

      {logModal && (
        <LogsViewer
          logs={logs}
          loading={logsLoading}
          jobId={logModal}
          onClose={() => setLogModal(null)}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.msg}
          confirmLabel={confirm.confirmLabel}
          danger={confirm.danger}
          onConfirm={() => { confirm.onOk(); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
