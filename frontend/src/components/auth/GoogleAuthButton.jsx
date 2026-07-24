import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function GoogleAuthButton({ role = 'client' }) {
    const { loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [googleCredential, setGoogleCredential] = useState(null);
    const [cliPassword, setCliPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSuccess = async (credentialResponse) => {
        setError('');
        if (role === 'provider') {
            // Providers must set a CLI password before we can register them
            setGoogleCredential(credentialResponse.credential);
            setShowPasswordModal(true);
        } else {
            try {
                const user = await loginWithGoogle(credentialResponse.credential, role);
                const paths = { client: '/dashboard/client', provider: '/dashboard/provider', admin: '/dashboard/admin' };
                navigate(paths[user.role] || '/dashboard');
            } catch (err) {
                setError(err.detail || 'Google sign-in failed. Please try again.');
            }
        }
    };

    const handleError = () => {
        setError('Google sign-in was cancelled or failed. Please try again.');
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            const user = await loginWithGoogle(googleCredential, role, cliPassword);
            setShowPasswordModal(false);
            const paths = { client: '/dashboard/client', provider: '/dashboard/provider', admin: '/dashboard/admin' };
            navigate(paths[user.role] || '/dashboard');
        } catch (err) {
            setError(err.detail || 'Failed to create account. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {error && (
                <p style={{ color: 'var(--lp-error, #ef4444)', fontSize: '0.875rem', textAlign: 'center', margin: '8px 0 0' }}>
                    {error}
                </p>
            )}
            <div className="lp-google-auth-wrapper" style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
                <GoogleLogin
                    onSuccess={handleSuccess}
                    onError={handleError}
                    text="continue_with"
                    theme="outline"
                    shape="pill"
                />
            </div>

            <AnimatePresence>
                {showPasswordModal && (
                    <motion.div
                        className="lp-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
                    >
                        <motion.div
                            className="lp-modal-content"
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '16px', width: '90%', maxWidth: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
                        >
                            <h3 style={{ margin: '0 0 8px', fontSize: '1.5rem', color: 'var(--lp-midnight-ink)', fontWeight: '600', letterSpacing: '-0.02em' }}>Set Agent Password</h3>
                            <p style={{ margin: '0 0 6px', fontSize: '0.95rem', color: 'var(--lp-slate-caption)', lineHeight: '1.5' }}>
                                To run the Provider Agent on your machine, you need a password.
                            </p>
                            <p style={{ margin: '0 0 24px', fontSize: '0.85rem', color: 'var(--lp-slate-caption)', lineHeight: '1.5', background: 'rgba(0,0,0,0.04)', padding: '10px 12px', borderRadius: '8px' }}>
                                💡 This password is stored securely and lets the Agent app authenticate to the backend using your email + this password — even when you log in via Google on the web.
                            </p>

                            {error && (
                                <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: '0 0 16px', padding: '8px 12px', background: '#fef2f2', borderRadius: '8px' }}>
                                    {error}
                                </p>
                            )}

                            <form onSubmit={handlePasswordSubmit}>
                                <div className="lp-auth__form-group" style={{ textAlign: 'left' }}>
                                    <label className="lp-auth__label">CLI / Agent Password</label>
                                    <input
                                        className="lp-input"
                                        type="password"
                                        required
                                        minLength={8}
                                        placeholder="Min. 8 characters"
                                        value={cliPassword}
                                        onChange={(e) => setCliPassword(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                                    <button
                                        type="button"
                                        className="lp-btn-ghost"
                                        onClick={() => { setShowPasswordModal(false); setError(''); }}
                                        style={{ flex: 1, justifyContent: 'center' }}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="lp-btn-inverse"
                                        disabled={isSubmitting}
                                        style={{ flex: 1, justifyContent: 'center' }}
                                    >
                                        {isSubmitting ? 'Creating account…' : 'Save & Continue'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
