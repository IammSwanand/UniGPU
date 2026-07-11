import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

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
        <div className="auth-page">
            <div className="auth-card glass-elevated animate-in">
                <Link to="/login" className="btn btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px', padding: '6px 12px', fontSize: '0.9rem', marginLeft: '-12px' }}>
                    <FontAwesomeIcon icon={faArrowLeft} /> Back to Sign In
                </Link>
                <h2>Forgot password</h2>
                <p className="subtitle">Enter your email and we'll send you a reset link</p>

                {error && <div className="error-msg">{error}</div>}
                {success && <div className="success-msg">{success}</div>}

                {!success && (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Email</label>
                            <input className="input" type="email" placeholder="you@university.edu"
                                value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <button className="btn btn-primary" type="submit" disabled={loading}
                            style={{ width: '100%', marginTop: '8px' }}>
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    Remember your password? <Link to="/login">Sign In</Link>
                </div>
            </div>
        </div>
    );
}
