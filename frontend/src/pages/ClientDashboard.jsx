import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { useToasts } from '../components/client-dashboard/useToasts';
import ToastStack from '../components/client-dashboard/Toast';
import DashboardNavbar from '../components/client-dashboard/DashboardNavbar';
import GpuNetworkStrip from '../components/client-dashboard/GpuNetworkStrip';
import Greeting from '../components/client-dashboard/Greeting';
import ExecutionWorkspace from '../components/client-dashboard/ExecutionWorkspace';
import RecentWorkloads from '../components/client-dashboard/RecentWorkloads';
import WorkloadDrawer from '../components/client-dashboard/WorkloadDrawer';
import LogsViewer from '../components/client-dashboard/LogsViewer';

import ConfirmDialog from '../components/client-dashboard/ConfirmDialog';

import { useLocation } from 'react-router-dom';

/**
 * ClientDashboard — orchestrator for the light-themed compute workspace.
 *
 * This page owns ALL state and API interactions, identical to the original
 * implementation (same 4 parallel GETs + 15s poll, same submit/cancel/delete
 * flow, same multipart contract). The rendering is delegated to sub-components
 * under the new `.client-dashboard` light surface.
 *
 * NO sidebar — replaced by the LP-style DashboardNavbar.
 * NO `alert()` — replaced by toasts.
 * Backend contract preserved verbatim: zero API changes.
 */
export default function ClientDashboard() {
  const { user } = useAuth();
  const location = useLocation();

  // ── Data state ──
  const [jobs, setJobs] = useState([]);
  const [wallet, setWallet] = useState(null);

  const [availableGPUs, setAvailableGPUs] = useState([]);
  const [busyGpusCount, setBusyGpusCount] = useState(0);

  // Parse selectedGpu from URL if coming from the marketplace
  const queryParams = new URLSearchParams(location.search);
  const initialGpu = queryParams.get('selectedGpu') || '';

  // ── Upload state ──
  const [selectedGPU, setSelectedGPU] = useState(initialGpu);
  const [script, setScript] = useState(null);
  const [scriptText, setScriptText] = useState('');
  const [scriptPreview, setScriptPreview] = useState(false);
  const [reqs, setReqs] = useState(null);
  const [reqText, setReqText] = useState('');
  const [reqPreview, setReqPreview] = useState(false);
  // Dataset
  const [dataset, setDataset] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // ── Modal / drawer state ──
  const [logModal, setLogModal] = useState(null);       // jobId for LogsViewer
  const [logs, setLogs] = useState('');
  const [logsLoading, setLogsLoading] = useState(false);
  const [drawerJob, setDrawerJob] = useState(null);      // JobOut for WorkloadDrawer
  const [confirm, setConfirm] = useState(null);          // { title, msg, confirmLabel, onOk, danger }



  // ── Toasts ──
  const { toasts, notify, dismiss } = useToasts();

  // ══════════════ Data loading ══════════════
  const load = useCallback(async () => {
    try {
      const [j, w, g, allGpus] = await Promise.all([
        api.listJobs(), api.getWallet(), api.availableGPUs(0), api.listGPUs()
      ]);
      setJobs(j);
      setWallet(w);
      setAvailableGPUs(g);
      setBusyGpusCount(allGpus.filter(gpu => gpu.status === 'busy').length);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, [load]);

  // ══════════════ Script upload ══════════════
  const handleScriptUpload = useCallback((file) => {
    if (!file) return;
    setScript(file);
    setScriptPreview(false);
    const reader = new FileReader();
    reader.onload = (ev) => setScriptText(ev.target.result);
    reader.readAsText(file);
  }, []);

  const handleClearScript = useCallback(() => {
    setScript(null);
    setScriptText('');
    setScriptPreview(false);
  }, []);

  // ══════════════ Requirements upload ══════════════
  const handleReqsUpload = useCallback((file) => {
    if (!file) return;
    setReqs(file);
    setReqPreview(false);
    const reader = new FileReader();
    reader.onload = (ev) => setReqText(ev.target.result);
    reader.readAsText(file);
  }, []);

  const handleClearReqs = useCallback(() => {
    setReqs(null);
    setReqText('');
    setReqPreview(false);
    setDataset(null);
  }, []);

  // ══════════════ Submit workload ══════════════
  const handleSubmit = useCallback(async () => {
    if (!script) return;
    setSubmitting(true);
    try {
      const finalScript = new File([scriptText], script.name, { type: script.type || 'text/plain' });
      let finalReqs = undefined;
      if (reqs) {
        finalReqs = new File([reqText], reqs.name, { type: reqs.type || 'text/plain' });
      }
      await api.submitJob(finalScript, finalReqs, selectedGPU || undefined, dataset);
      // Reset workspace
      setScript(null);
      setScriptText('');
      setScriptPreview(false);
      setReqs(null);
      setReqText('');
      setReqPreview(false);
      setDataset(null);
      setSelectedGPU('');
      notify('Workload submitted successfully.', 'success');
      await load();
      setTimeout(() => {
        document.getElementById('workloads-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (e) {
      notify(e.detail || 'Unable to submit workload. Scheduler unavailable.', 'error');
    } finally {
      setSubmitting(false);
    }
  }, [script, scriptText, reqs, reqText, selectedGPU, dataset, notify, load]);

  // ══════════════ Reset workspace ══════════════
  const handleReset = useCallback(() => {
    setConfirm({
      title: 'Clear current workspace?',
      message: 'Uploaded files and unsaved changes will be removed.',
      confirmLabel: 'Clear Workspace',
      cancelLabel: 'Keep Editing',
      onOk: () => {
        handleClearScript();
        handleClearReqs();
        setSelectedGPU('');
        setConfirm(null);
        notify('Workspace cleared.', 'info');
      },
      danger: false,
    });
  }, [handleClearScript, handleClearReqs, notify]);



  // ══════════════ Logs ══════════════
  const fetchLogs = useCallback(async (jobId) => {
    setLogModal(jobId);
    setLogsLoading(true);
    try {
      const res = await api.getJobLogs(jobId);
      setLogs(res.logs || '');
    } catch {
      setLogs('Failed to load logs.');
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const fetchDrawerLogs = useCallback(async (jobId) => {
    setLogsLoading(true);
    try {
      const res = await api.getJobLogs(jobId);
      setLogs(res.logs || '');
    } catch {
      setLogs('');
    } finally {
      setLogsLoading(false);
    }
  }, []);

  // ══════════════ Stop / Delete actions ══════════════
  const handleStop = useCallback((job) => {
    setConfirm({
      title: 'Stop this workload?',
      message: 'The workload will be cancelled and its execution halted.',
      confirmLabel: 'Stop',
      cancelLabel: 'Cancel',
      danger: true,
      onOk: async () => {
        setConfirm(null);
        try {
          await api.cancelJob(job.id);
          notify('Workload stopped.', 'warning');
          await load();
        } catch (e) {
          notify(e.detail || 'Failed to stop workload.', 'error');
        }
      },
    });
  }, [notify, load]);

  const handleDelete = useCallback((job) => {
    setConfirm({
      title: 'Delete Workload?',
      message: 'This action permanently removes the workload history from your dashboard.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      danger: true,
      onOk: async () => {
        setConfirm(null);
        try {
          // If still running/queued, cancel first.
          if (['queued', 'running', 'pending'].includes(job.status)) {
            await api.cancelJob(job.id);
          }
          await api.deleteJob(job.id);
          notify('Workload deleted.', 'info');
          await load();
        } catch (e) {
          notify(e.detail || 'Failed to delete workload.', 'error');
        }
      },
    });
  }, [notify, load]);

  // ══════════════ Helpers ══════════════
  const gpuNameFor = useCallback((gpuId) => {
    if (!gpuId) return 'Auto';
    const g = availableGPUs.find((gpu) => gpu.id === gpuId);
    return g ? g.name : gpuId.slice(0, 8) + '…';
  }, [availableGPUs]);

  // ══════════════ Render ══════════════
  return (
    <div className="client-dashboard">
      {/* Fixed top navbar */}
      <DashboardNavbar wallet={wallet} />

      {/* Main content shell, padded below the fixed nav */}
      <div className="cd-shell">
        {/* Greeting */}
        <Greeting user={user} />

        {/* GPU Network strip */}
        <GpuNetworkStrip availableGPUs={availableGPUs} busyCount={busyGpusCount} />

        {/* Execution workspace: upload + editor + gpu + submit */}
        <ExecutionWorkspace
          availableGPUs={availableGPUs}
          script={script}
          onScript={handleScriptUpload}
          clearScript={handleClearScript}
          scriptText={scriptText}
          onScriptText={setScriptText}
          scriptPreview={scriptPreview}
          toggleScriptPreview={() => setScriptPreview((v) => !v)}
          reqs={reqs}
          onReqs={handleReqsUpload}
          clearReqs={handleClearReqs}
          reqText={reqText}
          onReqText={setReqText}
          reqPreview={reqPreview}
          toggleReqPreview={() => setReqPreview((v) => !v)}
          dataset={dataset}
          onDataset={setDataset}
          onClearDataset={() => setDataset(null)}
          selectedGPU={selectedGPU}
          onSelectGPU={setSelectedGPU}
          submitting={submitting}
          onSubmit={handleSubmit}
          onReset={handleReset}
        />

        {/* Recent workloads table */}
        <RecentWorkloads
          jobs={jobs}
          gpuNameFor={gpuNameFor}
          onViewLogs={fetchLogs}
          onStop={handleStop}
          onDelete={handleDelete}
          onSelectJob={setDrawerJob}
        />


      </div>

      {/* ── Overlays ── */}
      {logModal && (
        <LogsViewer
          logs={logs}
          loading={logsLoading}
          jobId={logModal}
          onClose={() => setLogModal(null)}
        />
      )}

      {drawerJob && (
        <WorkloadDrawer
          job={drawerJob}
          onClose={() => setDrawerJob(null)}
          availableGPUs={availableGPUs}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          cancelLabel={confirm.cancelLabel}
          onConfirm={confirm.onOk}
          onCancel={() => setConfirm(null)}
          danger={confirm.danger}
        />
      )}

      {/* Toasts */}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
