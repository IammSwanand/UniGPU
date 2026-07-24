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

    const handleSuccess = (credentialResponse) => {
        if (role === 'provider') {
            setGoogleCredential(credentialResponse.credential);
            setShowPasswordModal(true);
        } else {
            loginWithGoogle(credentialResponse.credential, role);
            navigate('/dashboard/client');
        }
    };

    const handleError = () => {
        console.error('Google Login Failed');
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate backend call to save the CLI password
        setTimeout(() => {
            loginWithGoogle(googleCredential, role); 
            setIsSubmitting(false);
            setShowPasswordModal(false);
            navigate('/dashboard/provider');
        }, 800);
    };

    return (
        <>
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
                            <h3 style={{ margin: '0 0 12px', fontSize: '1.5rem', color: 'var(--lp-midnight-ink)', fontWeight: '600', letterSpacing: '-0.02em' }}>Set Agent Password</h3>
                            <p style={{ margin: '0 0 24px', fontSize: '0.95rem', color: 'var(--lp-slate-caption)', lineHeight: '1.5' }}>
                                To run the Provider CLI Agent on your machine, you will need a traditional password. 
                                Please set one now.
                            </p>
                            <form onSubmit={handlePasswordSubmit}>
                                <div className="lp-auth__form-group" style={{ textAlign: 'left' }}>
                                    <label className="lp-auth__label">CLI Password</label>
                                    <input 
                                        className="lp-input" 
                                        type="password" 
                                        required 
                                        placeholder="Choose a strong password"
                                        value={cliPassword}
                                        onChange={(e) => setCliPassword(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                                    <button type="button" className="lp-btn-ghost" onClick={() => setShowPasswordModal(false)} style={{ flex: 1, justifyContent: 'center' }}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="lp-btn-inverse" disabled={isSubmitting} style={{ flex: 1, justifyContent: 'center' }}>
                                        {isSubmitting ? 'Saving...' : 'Save & Continue'}
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
