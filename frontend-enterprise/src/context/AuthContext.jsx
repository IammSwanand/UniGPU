import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const email = localStorage.getItem('email');
        if (token && role === 'enterprise') {
            setUser({ email, role });
        }
        setLoading(false);

        const handleUnauthorized = () => {
            logout();
        };
        window.addEventListener('unauthorized', handleUnauthorized);
        return () => window.removeEventListener('unauthorized', handleUnauthorized);
    }, []);

    const login = async (email, password) => {
        const data = await api.login({ email, password });
        if (data.role !== 'enterprise' && data.role !== 'admin') {
            throw new Error("Access denied: Not an enterprise account.");
        }
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('email', data.email);
        setUser({ email: data.email, role: data.role });
    };

    const register = async (email, username, password) => {
        await api.register({ email, username, password });
        await login(email, password);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('email');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
