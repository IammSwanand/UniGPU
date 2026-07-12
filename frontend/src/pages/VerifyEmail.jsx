import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/landing/Navbar';
import CodeWindow from '../components/landing/CodeWindow';

export default function VerifyEmail() {
    const location = useLocation();
    const navigate = useNavigate();
    const { verifyEmail, resendVerification } = useAuth();
    const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const token = params.get('token') || '';
    const initialEmail = params.get('email') || '';
    const [email, setEmail] = useState(initialEmail);
    // verifying -> request in flight after clicking the email link
    // verified  -> backend confirmed, redirecting to /login
    // idle      -> no token (landed here manually or resend flow) or a failed attempt
    const [status, setStatus] = useState(token ? 'verifying' : 'idle');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
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
                setMessage('Verification done! Redirecting you to sign in...');
                setTimeout(() => {
                    navigate('/login', {
                        state: { message: 'Email verified successfully. Please sign in.' },
                    });
                }, 400);
            } catch (err) {
                if (!active) return;
                setStatus('idle');
                setError(err.detail || 'Verification failed. The link may be invalid or expired.');
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
                <div className="lp-auth">
                    <aside className="lp-auth__aside">
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
                    </aside>

                    <section className="lp-auth__main">
                        {status === 'verifying' && (
                            <div className="lp-auth__static-panel">
                                <Link to="/register" className="lp-auth__back">← Back to Sign Up</Link>
                                <h2 className="lp-auth__title">Verifying your email…</h2>
                                <p className="lp-auth__subtitle">
                                    Your email is being verified. Please wait a moment.
                                </p>
                            </div>
                        )}

                        {status === 'verified' && (
                            <div className="lp-auth__static-panel">
                                <h2 className="lp-auth__title">Verification done!</h2>
                                <p className="lp-auth__subtitle">
                                    Your email has been verified successfully. Redirecting you to sign in…
                                </p>
                                <div className="lp-auth__footer">
                                    <Link to="/login">Click here if you are not redirected</Link>
                                </div>
                            </div>
                        )}

                        {status === 'idle' && (
                            <>
                                <div>
                                    <Link to="/register" className="lp-auth__back">← Back to Sign Up</Link>
                                </div>
                                <h2 className="lp-auth__title">Verify your email</h2>
                                <p className="lp-auth__subtitle">
                                    We need one verified email before you can continue.
                                </p>

                                {message && <div className="lp-auth__success">{message}</div>}
                                {error && <div className="lp-auth__error">{error}</div>}

                                <form className="lp-auth__form" onSubmit={handleResend}>
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
                                </form>

                                <div className="lp-auth__divider" />
                                <div className="lp-auth__footer">
                                    Already verified? <Link to="/login">Sign In</Link>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
