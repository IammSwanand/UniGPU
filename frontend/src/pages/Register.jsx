import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRocket, faBolt } from '@fortawesome/free-solid-svg-icons';
import Navbar from '../components/landing/Navbar';
import CodeWindow from '../components/landing/CodeWindow';
import { containerVariants, childVariants, asideVariants } from '../lib/authMotion';

export default function Register() {
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const searchParams = new URLSearchParams(location.search);
    const initialRole = searchParams.get('role') === 'provider' ? 'provider' : 'client';
    const [role, setRole] = useState(initialRole);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');
    const [resendMessage, setResendMessage] = useState('');
    const [resendError, setResendError] = useState('');
    const [resendLoading, setResendLoading] = useState(false);
    const { register, resendVerification } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register({ email, username, password, role });
            setRegisteredEmail(email);
        } catch (err) {
            setError(err.detail || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResendError('');
        setResendMessage('');
        setResendLoading(true);
        try {
            await resendVerification(registeredEmail);
            setResendMessage('Verification email sent. Check your inbox and spam folder.');
        } catch (err) {
            setResendError(err.detail || 'Could not resend verification email');
        } finally {
            setResendLoading(false);
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
                        <span className="lp-auth__aside-eyebrow">Create Account</span>
                        <h1 className="lp-auth__aside-headline">Join the marketplace.</h1>
                        <p className="lp-auth__aside-sub">
                            Run Python workloads on idle student GPUs, or share your own hardware and
                            earn wallet credit. One account, two ways to compute.
                        </p>
                        <div className="lp-auth__aside-code">
                            <CodeWindow filename="terminal" animate={false}>
                                <span className="lp-tok-prompt">$ </span>
                                <span className="lp-tok-keyword">unigpu</span>
                                <span className="lp-tok-string"> register --role {role}</span>
                                {'\n\n'}
                                <span className="lp-tok-success">✓ </span>
                                <span className="lp-tok-output">Account created</span>
                                {'\n'}
                                <span className="lp-tok-success">✓ </span>
                                <span className="lp-tok-output">Verification email sent</span>
                                {'\n'}
                                <span className="lp-tok-success">✓ </span>
                                <span className="lp-tok-output">Account activates after verification</span>
                                {'\n\n'}
                                <span className="lp-tok-comment">Check your inbox to activate the account.</span>
                            </CodeWindow>
                        </div>
                    </motion.aside>

                    {/* ── Main — form panel ── */}
                    <motion.section className="lp-auth__main" variants={asideVariants}>
                        {registeredEmail ? (
                            <motion.div variants={childVariants} className="lp-auth__success-card">
                                <motion.h2 className="lp-auth__title" variants={childVariants}>
                                    Verification link sent
                                </motion.h2>
                                <motion.p className="lp-auth__subtitle" variants={childVariants}>
                                    Your account was created. We sent a verification link to{' '}
                                    <strong>{registeredEmail}</strong>. Please check your mailbox and
                                    click the link to verify your email.
                                </motion.p>

                                {resendMessage && (
                                    <motion.div className="lp-auth__success" variants={childVariants}>
                                        {resendMessage}
                                    </motion.div>
                                )}
                                {resendError && (
                                    <motion.div className="lp-auth__error" variants={childVariants}>
                                        {resendError}
                                    </motion.div>
                                )}

                                <motion.div variants={childVariants} className="lp-auth__success-actions">
                                    <button
                                        className="lp-btn-inverse lp-auth__submit"
                                        type="button"
                                        onClick={handleResend}
                                        disabled={resendLoading}
                                    >
                                        {resendLoading ? 'Sending…' : 'Resend verification email'}
                                    </button>
                                </motion.div>

                                <motion.div className="lp-auth__divider" variants={childVariants} />
                                <motion.div className="lp-auth__footer" variants={childVariants}>
                                    Already verified? <Link to="/login">Sign In</Link>
                                </motion.div>
                            </motion.div>
                        ) : (
                            <>
                                <motion.div variants={childVariants}>
                                    <Link to="/" className="lp-auth__back">← Back to Home</Link>
                                </motion.div>
                                <motion.h2 className="lp-auth__title" variants={childVariants}>Create Account</motion.h2>
                                <motion.p className="lp-auth__subtitle" variants={childVariants}>
                                    Join the UniGPU marketplace
                                </motion.p>

                                {error && <motion.div className="lp-auth__error" variants={childVariants}>{error}</motion.div>}

                                <motion.form className="lp-auth__form" onSubmit={handleSubmit} variants={childVariants}>
                                    <div className="lp-auth__form-group">
                                        <label className="lp-auth__label">I want to</label>
                                        <div className="lp-auth__role">
                                            <button type="button"
                                                className={`lp-auth__role-btn ${role === 'client' ? 'lp-auth__role-btn--active' : ''}`}
                                                onClick={() => setRole('client')}>
                                                <FontAwesomeIcon icon={faRocket} /> Rent GPU
                                            </button>
                                            <button type="button"
                                                className={`lp-auth__role-btn ${role === 'provider' ? 'lp-auth__role-btn--active' : ''}`}
                                                onClick={() => setRole('provider')}>
                                                <FontAwesomeIcon icon={faBolt} /> Provide GPU
                                            </button>
                                        </div>
                                    </div>
                                    <div className="lp-auth__form-group">
                                        <label className="lp-auth__label">Email</label>
                                        <input className="lp-input" type="email" placeholder="you@university.edu"
                                            value={email} onChange={e => setEmail(e.target.value)} required />
                                    </div>
                                    <div className="lp-auth__form-group">
                                        <label className="lp-auth__label">Username</label>
                                        <input className="lp-input" type="text" placeholder="Choose a username"
                                            value={username} onChange={e => setUsername(e.target.value)} required />
                                    </div>
                                    <div className="lp-auth__form-group">
                                        <label className="lp-auth__label">Password</label>
                                        <input className="lp-input" type="password" placeholder="Choose a password"
                                            value={password} onChange={e => setPassword(e.target.value)} required />
                                    </div>
                                    <button className="lp-btn-inverse lp-auth__submit" type="submit" disabled={loading}>
                                        {loading ? 'Creating…' : 'Create Account'}
                                    </button>
                                </motion.form>

                                <motion.div className="lp-auth__divider" variants={childVariants} />
                                <motion.div className="lp-auth__footer" variants={childVariants}>
                                    Already have an account? <Link to="/login">Sign In</Link>
                                </motion.div>
                            </>
                        )}
                    </motion.section>
                </motion.div>
            </main>
        </div>
    );
}
