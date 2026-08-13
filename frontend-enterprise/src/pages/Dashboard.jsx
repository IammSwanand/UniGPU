import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Dashboard() {
    const [org, setOrg] = useState(null);
    const [clusters, setClusters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newClusterName, setNewClusterName] = useState('');
    const [apiKey, setApiKey] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const orgData = await api.getOrg();
            setOrg(orgData);
            const clusterData = await api.listClusters();
            setClusters(clusterData);
        } catch (err) {
            if (err.status === 404) {
                // Not found
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!org) return;

        const token = localStorage.getItem('token');
        // Determine WS URL based on current host (assume localhost:8000 for local dev)
        const wsUrl = `ws://localhost:8000/enterprise/ws/dashboard/${org.id}?token=${token}`;
        const ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'NODE_CONNECTED') {
                setClusters(prev => prev.map(c => {
                    if (c.id === data.cluster_id) {
                        const newNodes = c.nodes ? [...c.nodes] : [];
                        // Avoid duplicates if reconnecting
                        if (!newNodes.find(n => n.id === data.node_id)) {
                            newNodes.push({ id: data.node_id, vram_mb: data.vram_mb, status: 'online' });
                        }
                        return { ...c, nodes: newNodes };
                    }
                    return c;
                }));
            } else if (data.type === 'NODE_DISCONNECTED') {
                setClusters(prev => prev.map(c => {
                    if (c.id === data.cluster_id && c.nodes) {
                        return { ...c, nodes: c.nodes.map(n => n.id === data.node_id ? { ...n, status: 'offline' } : n) };
                    }
                    return c;
                }));
            } else if (data.type === 'NODE_TELEMETRY') {
                setClusters(prev => prev.map(c => {
                    if (c.id === data.cluster_id && c.nodes) {
                        return { ...c, nodes: c.nodes.map(n => n.id === data.node_id ? { ...n, vram_mb: data.vram_mb, status: 'online' } : n) };
                    }
                    return c;
                }));
            }
        };

        return () => ws.close();
    }, [org]);

    const handleCreateOrg = async (e) => {
        e.preventDefault();
        const orgName = prompt("Enter your Organization name:");
        if (!orgName) return;
        try {
            const newOrg = await api.createOrg({ name: orgName });
            setOrg(newOrg);
        } catch (err) {
            alert(err.detail || "Failed to create organization");
        }
    };

    const handleGenerateApiKey = async () => {
        if (!window.confirm("Generating a new API Key will invalidate your existing key. Continue?")) return;
        try {
            const res = await api.generateApiKey();
            setApiKey(res.api_key);
        } catch (err) {
            alert(err.detail || "Failed to generate key");
        }
    };

    const handleCreateCluster = async (e) => {
        e.preventDefault();
        if (!newClusterName) return;
        try {
            const newCluster = await api.createCluster({ 
                name: newClusterName, 
                organization_id: org.id 
            });
            setClusters([...clusters, newCluster]);
            setNewClusterName('');
        } catch (err) {
            alert(err.detail || "Failed to create cluster");
        }
    };

    const handleDeleteCluster = async (clusterId) => {
        if (!window.confirm("Are you sure you want to delete this cluster? This action cannot be undone.")) return;
        try {
            await api.deleteCluster(clusterId);
            setClusters(clusters.filter(c => c.id !== clusterId));
        } catch (err) {
            alert(err.detail || "Failed to delete cluster");
        }
    };

    const totalActiveNodes = clusters.reduce((sum, c) => sum + (c.nodes || []).filter(n => n.status === 'online').length, 0);

    if (loading) return <div>Loading dashboard...</div>;

    if (!org) {
        return (
            <div>
                <h1 style={{ marginBottom: '1rem' }}>Welcome to UniGPU Enterprise</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>You need to set up your organization before creating clusters.</p>
                <button className="btn btn-primary" onClick={handleCreateOrg}>
                    Create Organization
                </button>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem' }}>{org.name} Overview</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage your Ray clusters and monitor node health.</p>
                </div>
                <div>
                    <button className="btn" style={{ backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'white' }} onClick={handleGenerateApiKey}>
                        Generate Node API Key
                    </button>
                </div>
            </div>

            {apiKey && (
                <div style={{ padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent)', borderRadius: '0.5rem', marginBottom: '2rem' }}>
                    <div style={{ color: 'var(--accent)', fontWeight: 'bold', marginBottom: '0.5rem' }}>New API Key Generated:</div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <code style={{ fontSize: '1.25rem', padding: '0.5rem', backgroundColor: 'var(--bg-dark)', borderRadius: '0.25rem', display: 'block', flexGrow: 1 }}>{apiKey}</code>
                        <button className="btn" style={{ backgroundColor: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border)' }} onClick={(e) => { navigator.clipboard.writeText(apiKey); e.target.innerText = 'Copied!'; setTimeout(() => e.target.innerText = 'Copy', 2000); }}>Copy</button>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>Copy this key now. You won't be able to see it again.</div>
                </div>
            )}

            <div className="grid">
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Total Clusters</span>
                        <span className="badge badge-online">Active</span>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>{clusters.length}</div>
                </div>
                <div className="card">
                    <div className="card-header">
                        <span className="card-title">Active Nodes</span>
                    </div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>
                        {totalActiveNodes}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2>Ray Clusters</h2>
                    <form onSubmit={handleCreateCluster} style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                            type="text" 
                            className="form-control" 
                            placeholder="New Cluster Name" 
                            value={newClusterName}
                            onChange={e => setNewClusterName(e.target.value)}
                            style={{ width: '250px' }}
                        />
                        <button type="submit" className="btn btn-primary">Create</button>
                    </form>
                </div>

                {clusters.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '1rem' }}>
                        <p style={{ color: 'var(--text-muted)' }}>No clusters found. Create one to get started.</p>
                    </div>
                ) : (
                    <div className="grid">
                        {clusters.map(cluster => {
                            const onlineNodes = cluster.nodes ? cluster.nodes.filter(n => n.status === 'online') : [];
                            const totalVramGB = onlineNodes.reduce((acc, n) => acc + n.vram_mb, 0) / 1024;
                            
                            return (
                                <div key={cluster.id} className="card">
                                    <div className="card-header" style={{ position: 'relative' }}>
                                        <span className="card-title">{cluster.name}</span>
                                        <button 
                                            className="btn" 
                                            style={{ position: 'absolute', right: 0, top: 0, padding: '0.2rem 0.5rem', fontSize: '0.75rem', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444' }} 
                                            onClick={() => handleDeleteCluster(cluster.id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                    <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                                        <span className="badge" style={{ backgroundColor: 'var(--bg-dark)', color: 'var(--text-muted)' }}>
                                            {onlineNodes.length} Nodes
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all', paddingRight: '1rem' }}>ID: {cluster.id}</span>
                                        <button className="btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', backgroundColor: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border)' }} onClick={(e) => { navigator.clipboard.writeText(cluster.id); e.target.innerText = 'Copied!'; setTimeout(() => e.target.innerText = 'Copy', 2000); }}>Copy</button>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                        Head Node IP: {cluster.head_node_ip || 'Waiting for CLI Agent...'}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                        Pooled VRAM: {totalVramGB > 0 ? totalVramGB.toFixed(1) + ' GB' : '0 GB'}
                                    </div>
                                    <button className="btn btn-block" style={{ backgroundColor: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border)' }}>
                                        View Node Topology
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
