import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    const applySession = (res) => {
        localStorage.setItem('token', res.access_token);
        const userData = {
            id: res.user_id,
            email: res.email,
            username: res.username,
            role: res.role,
            isEmailVerified: res.is_email_verified,
            is_2fa_enabled: res.is_2fa_enabled ?? false,
            github_handle: res.github_handle,
            linkedin_handle: res.linkedin_handle,
            huggingface_handle: res.huggingface_handle,
            kaggle_handle: res.kaggle_handle,
            location: res.location,
        };
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(res.access_token);
        setUser(userData);
        return userData;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    useEffect(() => {
        const initAuth = async () => {
            const savedToken = localStorage.getItem('token');
            const savedUser = localStorage.getItem('user');
            
            if (savedToken && savedUser) {
                try {
                    setToken(savedToken);
                    // Validate token with backend on initial load
                    const userData = await api.getMe();
                    setUser({ ...JSON.parse(savedUser), ...userData });
                } catch (err) {
                    if (err.status === 401) {
                        logout();
                    }
                }
            }
            setLoading(false);
        };
        
        initAuth();
    }, []);

    const login = async (email, password) => {
        const res = await api.login({ email, password });
        if (res.requires_2fa) return res;
        return applySession(res);
    };

    const verify2faLogin = async (tempToken, code) => {
        const res = await api.verify2faLogin({ temp_token: tempToken, code });
        return applySession(res);
    };

    const updateUser = (newUserData) => {
        const updated = { ...user, ...newUserData };
        localStorage.setItem('user', JSON.stringify(updated));
        setUser(updated);
    };

    const register = async (data) => {
        return api.register(data);
    };

    const verifyEmail = async (tokenValue) => api.verifyEmail({ token: tokenValue });

    const resendVerification = async (email) => {
        return api.resendVerification({ email });
    };



    const loginWithGoogle = async (idToken, selectedRole = 'client', cliPassword = null, location = null) => {
        const payload = { id_token: idToken, role: selectedRole };
        if (cliPassword) payload.cli_password = cliPassword;
        if (location) payload.location = location;
        const res = await api.googleAuth(payload);
        return applySession(res);
    };

    useEffect(() => {
        const handleUnauthorized = () => {
            logout();
        };
        window.addEventListener('unauthorized', handleUnauthorized);
        return () => window.removeEventListener('unauthorized', handleUnauthorized);
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, verify2faLogin, loginWithGoogle, register, verifyEmail, resendVerification, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
