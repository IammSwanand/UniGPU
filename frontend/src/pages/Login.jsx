import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

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
        <div className="auth-page">
            <div className="auth-card glass-elevated animate-in">
                <Link to="/" className="btn btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px', padding: '6px 12px', fontSize: '0.9rem', marginLeft: '-12px' }}>
                    <FontAwesomeIcon icon={faArrowLeft} /> Back to Home
                </Link>
                <h2>Welcome back</h2>
                <p className="subtitle">Sign in to your UniGPU account</p>

                {error && <div className="error-msg">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input className="input" type="email" placeholder="you@university.edu"
                            value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input className="input" type="password" placeholder="Enter password"
                            value={password} onChange={e => setPassword(e.target.value)} required />
                        <div style={{ textAlign: 'right', marginTop: '6px' }}>
                            <Link to="/forgot-password" style={{ fontSize: '0.85rem' }}>Forgot password?</Link>
                        </div>
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={loading}
                        style={{ width: '100%', marginTop: '8px' }}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="auth-footer">
                    Don't have an account? <Link to="/register">Register</Link>
                </div>
            </div>
        </div>
    );
}
