import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faTerminal } from '@fortawesome/free-solid-svg-icons';
import { faWindows, faLinux, faApple } from '@fortawesome/free-brands-svg-icons';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import Navbar from '../components/landing/Navbar';
import api from '../api/client';

export default function Download() {
    const [release, setRelease] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getLatestAgentRelease()
            .then(data => {
                setRelease(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load agent release:", err);
                setLoading(false);
            });
    }, []);

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f0f4fe' }}>
            <Navbar />

            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '120px 30px 60px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ backgroundColor: '#ffffff', padding: '40px 40px 60px', borderRadius: '16px', textAlign: 'center', width: '100%', maxWidth: '700px', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)' }}>
                    <div style={{ width: '100%', textAlign: 'left', marginBottom: '20px' }}>
                        <Link to="/" className="lp-auth__back" style={{ display: 'inline-flex', textDecoration: 'none' }}>← Back to Home</Link>
                    </div>
                    <div style={{ fontSize: '3rem', color: '#145aff', marginBottom: '24px', display: 'inline-block' }}>
                        <FontAwesomeIcon icon={faDownload} />
                    </div>

                    <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '16px', letterSpacing: '-0.03em', color: '#020520' }}>
                        Download Agent
                    </h1>

                    <p style={{ color: '#374151', fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '40px' }}>
                        Ready to share your idle GPU and earn credits? Download the UniGPU agent executable below to get started connecting to the network.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
                        {loading ? (
                            <div style={{ backgroundColor: '#e2e8f0', color: 'transparent', padding: '16px 32px', borderRadius: '8px', width: '100%', maxWidth: '400px', height: '56px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                        ) : release ? (
                            <a
                                href={release.download_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ backgroundColor: '#020520', color: '#ffffff', padding: '16px 32px', fontSize: '1.1rem', borderRadius: '8px', width: '100%', maxWidth: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', textDecoration: 'none', fontWeight: 600, transition: 'background-color 0.2s' }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0f172a'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#020520'}
                            >
                                <FontAwesomeIcon icon={faWindows} style={{ fontSize: '1.3rem' }} />
                                Download for Windows ({release.version})
                            </a>
                        ) : (
                            <button
                                disabled
                                style={{ backgroundColor: '#94a3b8', color: '#ffffff', padding: '16px 32px', fontSize: '1.1rem', borderRadius: '8px', width: '100%', maxWidth: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', border: 'none', fontWeight: 600, cursor: 'not-allowed' }}
                            >
                                <FontAwesomeIcon icon={faWindows} style={{ fontSize: '1.3rem' }} />
                                Release Coming Soon
                            </button>
                        )}

                        <div style={{ width: '100%', maxWidth: '400px', textAlign: 'left', backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>
                                    Release Notes
                                </div>
                                {release && (
                                    <div style={{ backgroundColor: '#f1f5f9', color: '#020520', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                                        {release.version}
                                    </div>
                                )}
                            </div>
                            
                            {loading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ height: '12px', backgroundColor: '#e2e8f0', borderRadius: '4px', width: '90%', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                                    <div style={{ height: '12px', backgroundColor: '#e2e8f0', borderRadius: '4px', width: '70%', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                                    <div style={{ height: '12px', backgroundColor: '#e2e8f0', borderRadius: '4px', width: '80%', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                                </div>
                            ) : release ? (
                                <div style={{ fontSize: '0.9rem', color: '#475569' }}>
                                    <ReactMarkdown
                                        components={{
                                            ul: ({node, ...props}) => <ul style={{ margin: '0', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }} {...props} />,
                                            li: ({node, ...props}) => <li style={{ lineHeight: '1.5' }} {...props} />,
                                            p: ({node, ...props}) => <p style={{ margin: '0 0 8px 0', lineHeight: '1.5' }} {...props} />
                                        }}
                                    >
                                        {release.patch_notes || 'No patch notes available.'}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>No agent release available yet. Check back later!</div>
                            )}
                        </div>

                        {/* Other Platforms Mention */}
                        <div style={{ display: 'flex', gap: '16px', color: '#6b7280', fontSize: '0.95rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FontAwesomeIcon icon={faLinux} /> Linux support coming soon
                            </span>
                            <span>•</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FontAwesomeIcon icon={faApple} /> macOS support coming soon
                            </span>
                        </div>
                    </div>



                </div>
            </div>

            <footer style={{ textAlign: 'center', padding: '40px', color: '#6b7280', fontSize: '0.85rem' }}>
                UniGPU - GUP Compute Platform - Built for Students - By Students <br />
                © 2026 UniGPU. All rights reserved.
            </footer>
        </div>
    );
}
