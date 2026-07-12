import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/landing/Navbar';
import CodeWindow from '../components/landing/CodeWindow';
import { containerVariants, childVariants, asideVariants } from '../lib/authMotion';

export default function VerifyEmail() {
    const location = useLocation();
    const navigate = useNavigate();
    const { verifyEmail, resendVerification } = useAuth();
    const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const token = params.get('token') || '';
    const initialEmail = params.get('email') || '';
    const [email, setEmail] = useState(initialEmail);
    const [status, setStatus] = useState(token ? 'verifying' : 'idle');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);

    useEffect(() => {
        let active = true;

        const runVerification = async () => {
            if (!token) {
                return;
            }

            try {
                await verifyEmail(token);
                if (!active) return;
                setStatus('verified');
                setMessage('Email verified successfully. Redirecting to sign in...');
                setTimeout(() => {
                    navigate('/login', {
                        state: { message: 'Email verified successfully. Please sign in.' },
                    });
                }, 1200);
            } catch (err) {
                if (!active) return;
                setStatus('idle');
                setError(err.detail || 'Verification failed');
            }
        };

        runVerification();

        return () => {
            active = false;
        };
    }, [token, navigate, verifyEmail]);

    const handleResend = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setResendLoading(true);
        try {
            await resendVerification(email);
            setMessage('Verification email sent. Check your inbox and spam folder.');
        } catch (err) {
            setError(err.detail || 'Could not resend verification email');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="landing-page auth-page--lp">
            <Navbar />
            <main id="main-content">
                <motion.div className="lp-auth" variants={containerVariants} initial="hidden" animate="show">
                    <motion.aside className="lp-auth__aside" variants={asideVariants}>
                        <span className="lp-auth__aside-eyebrow">Verify Email</span>
                        <h1 className="lp-auth__aside-headline">One click to unlock the account.</h1>
                        <p className="lp-auth__aside-sub">
                            We sent a secure verification link to your inbox. Click it to activate your UniGPU account and reach your dashboard.
                        </p>
                        <div className="lp-auth__aside-code">
                            <CodeWindow filename="terminal" animate={false}>
                                <span className="lp-tok-prompt">$ </span>
                                <span className="lp-tok-keyword">unigpu</span>
                                <span className="lp-tok-string"> verify-email</span>
                                {'\n\n'}
                                <span className="lp-tok-success">✓ </span>
                                <span className="lp-tok-output">Link sent to inbox</span>
                                {'\n'}
                                <span className="lp-tok-success">✓ </span>
                                <span className="lp-tok-output">Token expires in 24 hours</span>
                                {'\n'}
                                <span className="lp-tok-success">✓ </span>
                                <span className="lp-tok-output">Dashboard unlocks after verification</span>
                                {'\n\n'}
                                <span className="lp-tok-comment">No OTP needed.</span>
                            </CodeWindow>
                        </div>
                    </motion.aside>

                    <motion.section className="lp-auth__main" variants={asideVariants}>
                        <motion.div variants={childVariants}>
                            <Link to="/register" className="lp-auth__back">← Back to Sign Up</Link>
                        </motion.div>
                        <motion.h2 className="lp-auth__title" variants={childVariants}>Verify your email</motion.h2>
                        <motion.p className="lp-auth__subtitle" variants={childVariants}>
                            {status === 'verifying'
                                ? 'Checking your verification link...'
                                : 'We need one verified email before you can continue.'}
                        </motion.p>

                        {message && <motion.div className="lp-auth__error" variants={childVariants}>{message}</motion.div>}
                        {error && <motion.div className="lp-auth__error" variants={childVariants}>{error}</motion.div>}

                        <motion.form className="lp-auth__form" onSubmit={handleResend} variants={childVariants}>
                            <div className="lp-auth__form-group">
                                <label className="lp-auth__label">Email</label>
                                <input
                                    className="lp-input"
                                    type="email"
                                    placeholder="you@university.edu"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <button className="lp-btn-inverse lp-auth__submit" type="submit" disabled={resendLoading}>
                                {resendLoading ? 'Sending…' : 'Resend verification email'}
                            </button>
                        </motion.form>

                        <motion.div className="lp-auth__divider" variants={childVariants} />
                        <motion.div className="lp-auth__footer" variants={childVariants}>
                            Already verified? <Link to="/login">Sign In</Link>
                        </motion.div>
                    </motion.section>
                </motion.div>
            </main>
        </div>
    );
}