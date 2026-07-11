import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

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
        <div className="auth-page">
            <div className="auth-card glass-elevated animate-in">
                <Link to="/login" className="btn btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px', padding: '6px 12px', fontSize: '0.9rem', marginLeft: '-12px' }}>
                    <FontAwesomeIcon icon={faArrowLeft} /> Back to Sign In
                </Link>
                <h2>Reset password</h2>
                <p className="subtitle">Choose a new password for your account</p>

                {error && <div className="error-msg">{error}</div>}
                {success && <div className="success-msg">{success}</div>}

                {!success && (
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>New Password</label>
                            <input className="input" type="password" placeholder="At least 8 characters"
                                value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
                        </div>
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input className="input" type="password" placeholder="Re-enter password"
                                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} />
                        </div>
                        <button className="btn btn-primary" type="submit" disabled={loading || !token}
                            style={{ width: '100%', marginTop: '8px' }}>
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                )}

                {success && (
                    <div className="auth-footer">
                        Redirecting to sign in...
                    </div>
                )}
            </div>
        </div>
    );
}
