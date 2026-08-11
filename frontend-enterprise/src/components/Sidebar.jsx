import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
    const { user, logout } = useAuth();

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <span>⬡</span>
                <span>UniGPU Enterprise</span>
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    Dashboard
                </NavLink>
                {/* Future links for Clusters, Nodes, Settings */}
            </nav>

            <div style={{ marginTop: 'auto' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Signed in as <br />
                    <strong style={{ color: 'var(--text-main)' }}>{user?.email}</strong>
                </div>
                <button className="btn btn-block" style={{ backgroundColor: 'var(--border)', color: 'white' }} onClick={logout}>
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
