export default function ConnectionPipeline({ wsConnected, agentConnected, dockerHealthy }) {
  const Node = ({ label, isActive, title }) => (
    <div style={{ 
      display: 'flex', alignItems: 'center', gap: '6px', 
      padding: '4px 10px', 
      border: '1px solid var(--lp-stone-divider)', 
      borderRadius: '16px',
      background: 'var(--lp-snow-canvas, #fff)',
      zIndex: 2 
    }} title={title}>
      <div style={{ 
        width: '8px', height: '8px', borderRadius: '50%', 
        background: isActive ? '#15803D' : '#B91C1C' 
      }} />
      <div style={{ fontSize: '14px', color: 'var(--lp-midnight-ink)', opacity: 0.8, fontWeight: 500 }}>
        {label}
      </div>
    </div>
  );

  const Line = ({ isActive }) => (
    <div style={{ 
      flex: 1, height: '1px', 
      background: isActive ? '#15803D' : 'var(--lp-stone-divider)'
    }} />
  );

  return (
    <div style={{ width: '320px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Node label="backend" isActive={wsConnected} title="Secure connection between your machine and UniGPU backend" />
      <Line isActive={wsConnected && agentConnected} />
      <Node label="agent" isActive={agentConnected} title="The UniGPU Agent is responsible for receiving and executing workloads" />
      <Line isActive={agentConnected && dockerHealthy} />
      <Node label="docker" isActive={dockerHealthy} title="Docker is used to execute workloads securely inside isolated containers" />
    </div>
  );
}
