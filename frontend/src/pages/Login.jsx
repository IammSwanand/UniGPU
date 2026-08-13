import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/landing/Navbar';

import GoogleAuthButton from '../components/auth/GoogleAuthButton';
import { containerVariants, childVariants, asideVariants } from '../lib/authMotion';

export default function Login() {
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [requires2fa, setRequires2fa] = useState(false);
    const [tempToken, setTempToken] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendMessage, setResendMessage] = useState('');
    const { login, verify2faLogin, resendVerification } = useAuth();
    const navigate = useNavigate();
    const successMessage = location.state?.message || '';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setResendMessage('');
        setLoading(true);
        try {
            if (requires2fa) {
                const user = await verify2faLogin(tempToken, twoFactorCode);
                const paths = { client: '/dashboard/client', provider: '/dashboard/provider', admin: '/dashboard/admin' };
                navigate(paths[user.role] || '/dashboard');
            } else {
                const res = await login(email, password);
                if (res?.requires_2fa) {
                    setRequires2fa(true);
                    setTempToken(res.temp_token);
                } else {
                    const paths = { client: '/dashboard/client', provider: '/dashboard/provider', admin: '/dashboard/admin' };
                    navigate(paths[res.role] || '/dashboard');
                }
            }
        } catch (err) {
            setError(err.detail || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    const isUnverifiedError = error && (
        error.toLowerCase().includes('verify your email') ||
        error.toLowerCase().includes('verify the account')
    );

    const handleResendVerification = async () => {
        if (!email) {
            setResendMessage('Please enter your email address above first.');
            return;
        }
        setResendLoading(true);
        setResendMessage('');
        try {
            await resendVerification(email);
            setResendMessage('Verification email sent! Check your inbox (and spam folder).');
        } catch (err) {
            setResendMessage(err.detail || 'Failed to resend. Please try again.');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="landing-page auth-page--lp">
            {/* Background Video */}
            <div className="lp-bg-container">
                <video autoPlay loop muted playsInline className="lp-bg-video">
                    <source src="/assets/background/bg_2.mp4" type="video/mp4" />
                </video>
            </div>
            <Navbar />
            <main id="main-content">
                <motion.div
                    className="lp-auth"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                >
                    {/* ── Aside — lavender wash + code window ── */}
                    <motion.aside className="lp-auth__aside" variants={asideVariants}>
                        <span className="lp-auth__aside-eyebrow">Secure Access</span>
                        <h1 className="lp-auth__aside-headline">Compute awaits.</h1>
                        <p className="lp-auth__aside-sub">
                            Sign in to submit workloads, stream live execution logs, and manage your
                            wallet — all from the UniGPU marketplace.
                        </p>

                    </motion.aside>

                    {/* ── Main — form panel ── */}
                    <motion.section className="lp-auth__main" variants={asideVariants}>
                        <motion.div variants={childVariants}>
                            <Link to="/" className="lp-auth__back">← Back to Home</Link>
                        </motion.div>
                        <motion.h2 className="lp-auth__title" variants={childVariants}>Welcome back</motion.h2>
                        <motion.p className="lp-auth__subtitle" variants={childVariants}>
                            Sign in to your UniGPU account
                        </motion.p>

                        {successMessage && <motion.div className="lp-auth__error" variants={childVariants}>{successMessage}</motion.div>}
                        {error && (
                            <motion.div
                                className={`lp-auth__error${isUnverifiedError ? ' lp-auth__error--verify' : ''}`}
                                variants={childVariants}
                            >
                                {error === 'Account disabled' ? (
                                    <span>Account disabled. <Link to="/support" style={{ textDecoration: 'underline' }}>Contact support</Link></span>
                                ) : isUnverifiedError ? (
                                    <span>
                                        <span style={{ display: 'block', marginBottom: '0.5rem' }}>
                                            Please verify your email before signing in.
                                        </span>
                                        <span style={{ display: 'block', fontSize: '0.82rem', opacity: 0.85, marginBottom: '0.65rem' }}>
                                            Verification links expire after <strong>24 hours</strong>. If your link is old, request a new one.
                                        </span>
                                        <button
                                            type="button"
                                            className="lp-auth__resend-btn"
                                            onClick={handleResendVerification}
                                            disabled={resendLoading}
                                        >
                                            {resendLoading ? 'Sending…' : 'Resend verification email'}
                                        </button>
                                        {resendMessage && (
                                            <span style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.82rem', opacity: 0.9 }}>
                                                {resendMessage}
                                            </span>
                                        )}
                                    </span>
                                ) : (
                                    error
                                )}
                            </motion.div>
                        )}

                        <motion.form className="lp-auth__form" onSubmit={handleSubmit} variants={childVariants}>
                            {requires2fa ? (
                                <div className="lp-auth__form-group">
                                    <label className="lp-auth__label">Authenticator Code</label>
                                    <input className="lp-input" type="text"
                                        inputMode="numeric" pattern="[0-9]*" maxLength={6}
                                        placeholder="6-digit code"
                                        value={twoFactorCode} onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, ''))} required />
                                </div>
                            ) : (
                                <>
                                    <div className="lp-auth__form-group">
                                        <label className="lp-auth__label">Email</label>
                                        <input className="lp-input" type="email" placeholder="you@university.edu"
                                            value={email} onChange={e => setEmail(e.target.value)} required />
                                    </div>
                                    <div className="lp-auth__form-group">
                                        <label className="lp-auth__label">Password</label>
                                        <input className="lp-input" type="password" placeholder="Enter password"
                                            value={password} onChange={e => setPassword(e.target.value)} required />
                                        <div className="lp-auth__row">
                                            <Link to="/forgot-password" className="lp-auth__link">Forgot password?</Link>
                                        </div>
                                    </div>
                                </>
                            )}
                            <button className="lp-btn-inverse lp-auth__submit" type="submit" disabled={loading}>
                                {loading ? (requires2fa ? 'Verifying…' : 'Signing in…') : (requires2fa ? 'Verify Code' : 'Sign In')}
                            </button>
                        </motion.form>

                        <motion.div variants={childVariants}>
                            <GoogleAuthButton role="client" />
                        </motion.div>

                        <motion.div className="lp-auth__divider" variants={childVariants} />
                        <motion.div className="lp-auth__footer" variants={childVariants}>
                            Don&apos;t have an account? <Link to="/register">Register</Link>
                        </motion.div>
                    </motion.section>
                </motion.div>
            </main>
        </div>
    );
}
