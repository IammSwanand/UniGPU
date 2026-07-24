import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';

export default function GoogleAuthButton({ role = 'client' }) {
    const { loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleSuccess = (credentialResponse) => {
        loginWithGoogle(credentialResponse.credential, role);
        const paths = { client: '/dashboard/client', provider: '/dashboard/provider', admin: '/dashboard/admin' };
        navigate(paths[role] || '/dashboard');
    };

    const handleError = () => {
        console.error('Google Login Failed');
    };

    return (
        <div className="lp-google-auth-wrapper" style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
            <GoogleLogin
                onSuccess={handleSuccess}
                onError={handleError}
                text="continue_with"
                theme="outline"
                shape="pill"
            />
        </div>
    );
}
