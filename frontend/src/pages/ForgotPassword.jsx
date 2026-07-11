import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/client';
import Navbar from '../components/landing/Navbar';
import CodeWindow from '../components/landing/CodeWindow';
import { containerVariants, childVariants, asideVariants } from '../lib/authMotion';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            const res = await api.forgotPassword({ email });
            setSuccess(res.message);
        } catch (err) {
            setError(err.detail || 'Something went wrong. Please try again.');
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
                        <span className="lp-auth__aside-eyebrow">Recover Access</span>
                        <h1 className="lp-auth__aside-headline">Reset your password.</h1>
                        <p className="lp-auth__aside-sub">
                            Enter the email tied to your UniGPU account and we&apos;ll send a secure
                            reset link. It expires shortly, so check your inbox.
                        </p>
                        <div className="lp-auth__aside-code">
                            <CodeWindow filename="terminal" animate={false}>
                                <span className="lp-tok-prompt">$ </span>
                                <span className="lp-tok-keyword">unigpu</span>
                                <span className="lp-tok-string"> password reset</span>
                                {'\n\n'}
                                <span className="lp-tok-success">✓ </span>
                                <span className="lp-tok-output">Reset link generated</span>
                                {'\n'}
                                <span className="lp-tok-success">✓ </span>
                                <span className="lp-tok-output">Email dispatched</span>
                                {'\n\n'}
                                <span className="lp-tok-comment">Awaiting confirmation…</span>
                            </CodeWindow>
                        </div>
                    </motion.aside>

                    {/* ── Main — form panel ── */}
                    <motion.section className="lp-auth__main" variants={asideVariants}>
                        <motion.div variants={childVariants}>
                            <Link to="/login" className="lp-auth__back">← Back to Sign In</Link>
                        </motion.div>
                        <motion.h2 className="lp-auth__title" variants={childVariants}>Forgot password</motion.h2>
                        <motion.p className="lp-auth__subtitle" variants={childVariants}>
                            Enter your email and we&apos;ll send you a reset link
                        </motion.p>

                        {error && <motion.div className="lp-auth__error" variants={childVariants}>{error}</motion.div>}
                        {success && <motion.div className="lp-auth__success" variants={childVariants}>{success}</motion.div>}

                        {!success && (
                            <motion.form className="lp-auth__form" onSubmit={handleSubmit} variants={childVariants}>
                                <div className="lp-auth__form-group">
                                    <label className="lp-auth__label">Email</label>
                                    <input className="lp-input" type="email" placeholder="you@university.edu"
                                        value={email} onChange={e => setEmail(e.target.value)} required />
                                </div>
                                <button className="lp-btn-inverse lp-auth__submit" type="submit" disabled={loading}>
                                    {loading ? 'Sending…' : 'Send Reset Link'}
                                </button>
                            </motion.form>
                        )}

                        <motion.div className="lp-auth__divider" variants={childVariants} />
                        <motion.div className="lp-auth__footer" variants={childVariants}>
                            Remember your password? <Link to="/login">Sign In</Link>
                        </motion.div>
                    </motion.section>
                </motion.div>
            </main>
        </div>
    );
}
