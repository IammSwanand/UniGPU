import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTemperatureQuarter, faServer, faMicrochip, faMemory } from '@fortawesome/free-solid-svg-icons';

export default function SystemMetrics({ liveMetrics }) {
  if (!liveMetrics) {
    return (
      <div className="cd-empty" style={{
        marginTop: '16px',
        padding: '12px 16px',
        background: 'var(--lp-snow-canvas, #fff)',
        border: '1px solid var(--lp-stone-divider, #e5e7eb)',
        borderRadius: '15px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <p className="cd-empty__title">Waiting for metrics...</p>
        <p className="cd-empty__desc" style={{ marginBottom: 0 }}>Make sure your GPU is online and the agent is running.</p>
      </div>
    );
  }

  const getStatusColor = (val, amberThresh, redThresh) => {
    if (val >= redThresh) return '#B91C1C';
    if (val >= amberThresh) return 'var(--amber)';
    return '#15803D';
  };

  return (
    <div className="grid-4" style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
      <MetricCard
        label="GPU Temp"
        value={liveMetrics.gpu_temp_c}
        unit="°C"
        icon={faTemperatureQuarter}
        percent={Math.min((liveMetrics.gpu_temp_c || 0), 100)}
        color={getStatusColor(liveMetrics.gpu_temp_c || 0, 65, 80)}
      />
      <MetricCard
        label="GPU Usage"
        value={liveMetrics.gpu_util_pct}
        unit="%"
        icon={faMicrochip}
        percent={liveMetrics.gpu_util_pct || 0}
        color={getStatusColor(liveMetrics.gpu_util_pct || 0, 60, 90)}
      />
      <MetricCard
        label="CPU Usage"
        value={liveMetrics.cpu_pct}
        unit="%"
        icon={faServer}
        percent={liveMetrics.cpu_pct || 0}
        color={getStatusColor(liveMetrics.cpu_pct || 0, 60, 90)}
      />
      <MetricCard
        label="Memory"
        value={liveMetrics.mem_pct}
        unit="%"
        icon={faMemory}
        percent={liveMetrics.mem_pct || 0}
        color={getStatusColor(liveMetrics.mem_pct || 0, 50, 80)}
      />
    </div>
  );
}

function MetricCard({ label, value, unit, percent }) {
  return (
    <div style={{
      background: 'var(--lp-snow-canvas, #fff)',
      border: '1px solid var(--lp-stone-divider, #e5e7eb)',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      padding: '12px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      color: 'var(--lp-midnight-ink, #000)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '16px', fontWeight: 500 }}>
        <span>{label}</span>
        <span>{value ?? '—'}{unit}</span>
      </div>
      <div style={{ height: '8px', width: '100%', background: 'var(--lp-fog-surface, #f3f4f6)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${percent}%`, background: '#000', transition: 'width 0.3s ease' }} />
      </div>
    </div>
  );
}
