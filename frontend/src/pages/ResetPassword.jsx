import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/client';
import Navbar from '../components/landing/Navbar';
import CodeWindow from '../components/landing/CodeWindow';
import { containerVariants, childVariants, asideVariants } from '../lib/authMotion';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!token) {
            setError('Invalid reset link. Please request a new one.');
            return;
        }
        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const res = await api.resetPassword({ token, new_password: password });
            setSuccess(res.message);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.detail || 'Unable to reset password. The link may have expired.');
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
                        <span className="lp-auth__aside-eyebrow">Reset Access</span>
                        <h1 className="lp-auth__aside-headline">Choose a new password.</h1>
                        <p className="lp-auth__aside-sub">
                            Pick a strong password (at least 8 characters). After updating, you&apos;ll be
                            sent back to sign in with your new credentials.
                        </p>
                        <div className="lp-auth__aside-code">
                            <CodeWindow filename="terminal" animate={false}>
                                <span className="lp-tok-prompt">$ </span>
                                <span className="lp-tok-keyword">unigpu</span>
                                <span className="lp-tok-string"> password reset --token ••••</span>
                                {'\n\n'}
                                <span className="lp-tok-success">✓ </span>
                                <span className="lp-tok-output">Token verified</span>
                                {'\n'}
                                <span className="lp-tok-success">✓ </span>
                                <span className="lp-tok-output">Password updated</span>
                                {'\n\n'}
                                <span className="lp-tok-comment">Redirecting to sign in…</span>
                            </CodeWindow>
                        </div>
                    </motion.aside>

                    {/* ── Main — form panel ── */}
                    <motion.section className="lp-auth__main" variants={asideVariants}>
                        <motion.div variants={childVariants}>
                            <Link to="/login" className="lp-auth__back">← Back to Sign In</Link>
                        </motion.div>
                        <motion.h2 className="lp-auth__title" variants={childVariants}>Reset password</motion.h2>
                        <motion.p className="lp-auth__subtitle" variants={childVariants}>
                            Choose a new password for your account
                        </motion.p>

                        {error && <motion.div className="lp-auth__error" variants={childVariants}>{error}</motion.div>}
                        {success && <motion.div className="lp-auth__success" variants={childVariants}>{success}</motion.div>}

                        {!success && (
                            <motion.form className="lp-auth__form" onSubmit={handleSubmit} variants={childVariants}>
                                <div className="lp-auth__form-group">
                                    <label className="lp-auth__label">New Password</label>
                                    <input className="lp-input" type="password" placeholder="At least 8 characters"
                                        value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
                                </div>
                                <div className="lp-auth__form-group">
                                    <label className="lp-auth__label">Confirm Password</label>
                                    <input className="lp-input" type="password" placeholder="Re-enter password"
                                        value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} />
                                </div>
                                <button className="lp-btn-inverse lp-auth__submit" type="submit" disabled={loading || !token}>
                                    {loading ? 'Updating…' : 'Update Password'}
                                </button>
                            </motion.form>
                        )}

                        {success && (
                            <motion.div className="lp-auth__footer" variants={childVariants}>
                                Redirecting to sign in…
                            </motion.div>
                        )}
                    </motion.section>
                </motion.div>
            </main>
        </div>
    );
}
