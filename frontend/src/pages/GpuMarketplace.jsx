import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardNavbar from '../components/client-dashboard/DashboardNavbar';
import api from '../api/client';

export default function GpuMarketplace() {
  const navigate = useNavigate();
  const location = useLocation();
  const [gpus, setGpus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);

  const queryParams = new URLSearchParams(location.search);
  const mode = queryParams.get('mode'); // 'select' or null

  // Search and filters
  const [search, setSearch] = useState('');
  const [vendor, setVendor] = useState('All');
  const [minVram, setMinVram] = useState('All');
  const [sortBy, setSortBy] = useState('Recommended');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [gpusData, walletData] = await Promise.all([
        api.availableGPUs(),
        api.getWallet()
      ]);
      setWallet(walletData);
      // Add mock data for missing fields to showcase UI
      const enrichedGpus = gpusData.map(gpu => ({
        ...gpu,
        priceHr: 'N/A', 
        queueTime: 'N/A',
        bestFor: 'N/A',
        availability: 'N/A',
        region: 'N/A',
      }));
      setGpus(enrichedGpus);
    } catch (err) {
      console.error('Failed to load GPUs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (gpuId) => {
    if (mode === 'select') {
      navigate(`/dashboard/client?selectedGpu=${gpuId}`);
    } else {
      // In browse mode, act as a shortcut to deploy
      navigate(`/dashboard/client?selectedGpu=${gpuId}`);
    }
  };

  // Filter and sort logic
  let filteredGpus = gpus.filter(gpu => gpu.name.toLowerCase().includes(search.toLowerCase()));
  if (vendor !== 'All') {
    filteredGpus = filteredGpus.filter(gpu => gpu.name.toLowerCase().includes(vendor.toLowerCase()));
  }
  if (minVram !== 'All') {
    filteredGpus = filteredGpus.filter(gpu => (gpu.vram_mb / 1024) >= parseInt(minVram, 10));
  }

  // Very basic sorting implementation
  if (sortBy === 'Highest VRAM') {
    filteredGpus.sort((a, b) => b.vram_mb - a.vram_mb);
  }

  return (
    <div className="client-dashboard">
      <DashboardNavbar wallet={wallet} />

      <main className="cd-shell">
        <button 
          onClick={() => navigate('/dashboard/client')}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--lp-ash-helper)', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            fontSize: '14px',
            fontWeight: 500,
            padding: 0,
            marginBottom: '24px'
          }}
        >
          ← Back to Dashboard
        </button>

        <header style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--lp-midnight-ink)', marginBottom: '8px' }}>GPU Marketplace</h1>
          <p style={{ color: 'var(--lp-ash-helper)', fontSize: '1.1rem' }}>
            Discover and compare available GPU providers globally. Find the right compute for your workload.
          </p>
        </header>

        {/* Filters & Search Bar */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Search GPU models..." 
            className="input" 
            style={{ width: '300px', backgroundColor: 'var(--lp-surface-card)', borderColor: 'var(--lp-stone-divider)', color: 'var(--lp-midnight-ink)' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="input" style={{ width: '150px', backgroundColor: 'var(--lp-surface-card)', borderColor: 'var(--lp-stone-divider)', color: 'var(--lp-midnight-ink)' }} value={vendor} onChange={(e) => setVendor(e.target.value)}>
            <option value="All">All Vendors</option>
            <option value="NVIDIA">NVIDIA</option>
            <option value="AMD">AMD</option>
          </select>
          <select className="input" style={{ width: '150px', backgroundColor: 'var(--lp-surface-card)', borderColor: 'var(--lp-stone-divider)', color: 'var(--lp-midnight-ink)' }} value={minVram} onChange={(e) => setMinVram(e.target.value)}>
            <option value="All">Any VRAM</option>
            <option value="8">8GB+</option>
            <option value="16">16GB+</option>
            <option value="24">24GB+</option>
          </select>
          <select className="input" style={{ width: '180px', backgroundColor: 'var(--lp-surface-card)', borderColor: 'var(--lp-stone-divider)', color: 'var(--lp-midnight-ink)', marginLeft: 'auto' }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="Recommended">Recommended</option>
            <option value="Highest VRAM">Highest VRAM</option>
          </select>
        </div>

        {/* Data Table */}
        <div className="cd-table" style={{ backgroundColor: 'var(--lp-surface-card)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--lp-stone-divider)' }}>
          <div className="cd-table__scroll">
            <table style={{ margin: 0, width: '100%' }}>
              <thead>
                <tr>
                  <th>GPU Model</th>
                  <th>VRAM</th>
                  <th>CUDA Version</th>
                  <th>Starting Price/hr</th>
                  <th>Queue Time</th>
                  <th>Best For</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>Loading marketplace...</td></tr>
                ) : filteredGpus.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--lp-ash-helper)' }}>No GPUs found matching your filters.</td></tr>
                ) : (
                  filteredGpus.map((gpu) => (
                    <tr key={gpu.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--lp-midnight-ink)' }}>{gpu.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--lp-ash-helper)' }}>Provider: {gpu.id.substring(0, 8)}</div>
                      </td>
                      <td className="cd-table__mono">{(gpu.vram_mb / 1024).toFixed(0)} GB</td>
                      <td className="cd-table__mono">{gpu.cuda_version || 'N/A'}</td>
                      <td className="cd-table__mono" style={{ color: 'var(--lp-ash-helper)' }}>{gpu.priceHr}</td>
                      <td className="cd-table__mono">{gpu.queueTime}</td>
                      <td style={{ fontSize: '13px', color: 'var(--lp-slate-caption)' }}>{gpu.bestFor}</td>
                      <td style={{ textAlign: 'right' }}>
                        {mode === 'select' ? (
                          <button 
                            className="cd-btn cd-btn--primary" 
                            style={{ padding: '6px 16px', fontSize: '13px', minWidth: '80px' }}
                            onClick={() => handleSelect(gpu.id)}
                          >
                            Select
                          </button>
                        ) : (
                          <button 
                            className="cd-btn cd-btn--outline" 
                            style={{ padding: '6px 16px', fontSize: '13px', minWidth: '130px' }}
                            onClick={() => handleSelect(gpu.id)}
                          >
                            Deploy Workload
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
