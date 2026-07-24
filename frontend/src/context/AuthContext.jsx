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
        };
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(res.access_token);
        setUser(userData);
        return userData;
    };

    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const saved = localStorage.getItem('user');
        if (savedToken) {
            setToken(savedToken);
        }
        if (saved) {
            setUser(JSON.parse(saved));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const res = await api.login({ email, password });
        return applySession(res);
    };

    const register = async (data) => {
        return api.register(data);
    };

    const verifyEmail = async (tokenValue) => api.verifyEmail({ token: tokenValue });

    const resendVerification = async (email) => {
        return api.resendVerification({ email });
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const loginWithGoogle = async (idToken, selectedRole = 'client', cliPassword = null) => {
        const payload = { id_token: idToken, role: selectedRole };
        if (cliPassword) payload.cli_password = cliPassword;
        const res = await api.googleAuth(payload);
        return applySession(res);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, loginWithGoogle, register, verifyEmail, resendVerification, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
