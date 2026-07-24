import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/landing/Navbar';
import CodeWindow from '../components/landing/CodeWindow';
import GoogleAuthButton from '../components/auth/GoogleAuthButton';
import { containerVariants, childVariants, asideVariants } from '../lib/authMotion';

export default function Login() {
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const successMessage = location.state?.message || '';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login(email, password);
            const paths = { client: '/dashboard/client', provider: '/dashboard/provider', admin: '/dashboard/admin' };
            navigate(paths[user.role] || '/dashboard');
        } catch (err) {
            setError(err.detail || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="landing-page auth-page--lp">
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
                        <div className="lp-auth__aside-code">
                            <CodeWindow filename="terminal" animate={false}>
                                <span className="lp-tok-prompt">$ </span>
                                <span className="lp-tok-keyword">unigpu</span>
                                <span className="lp-tok-string"> login</span>
                                {'\n\n'}
                                <span className="lp-tok-success">✓ </span>
                                <span className="lp-tok-output">Authenticated</span>
                                {'\n'}
                                <span className="lp-tok-success">✓ </span>
                                <span className="lp-tok-output">Session token issued</span>
                                {'\n'}
                                <span className="lp-tok-success">✓ </span>
                                <span className="lp-tok-output">Wallet synced</span>
                                {'\n\n'}
                                <span className="lp-tok-comment">Ready to submit jobs.</span>
                            </CodeWindow>
                        </div>
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
                            <motion.div className="lp-auth__error" variants={childVariants}>
                                {error === 'Account disabled' ? (
                                    <span>Account disabled. <Link to="/support" style={{ textDecoration: 'underline' }}>Contact support</Link></span>
                                ) : (
                                    error
                                )}
                            </motion.div>
                        )}

                        <motion.form className="lp-auth__form" onSubmit={handleSubmit} variants={childVariants}>
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
                            <button className="lp-btn-inverse lp-auth__submit" type="submit" disabled={loading}>
                                {loading ? 'Signing in…' : 'Sign In'}
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
