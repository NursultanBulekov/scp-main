'use client';

import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import api from '@/lib/api';

interface User {
    id: number;
    email: string;
    role: string;
    supplier_id?: number;
    consumer_id?: number;
}

interface AuthContextType {
    token: string | null;
    user: User | null;
    login: (token: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (storedToken) {
                setToken(storedToken);
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
                try {
                    // Always verify token with backend for freshness
                    const response = await api.get('/auth/me', {
                        headers: { Authorization: `Bearer ${storedToken}` },
                    });
                    setUser(response.data);
                    localStorage.setItem('user', JSON.stringify(response.data));
                } catch (error) {
                    console.error('Failed to fetch user on init', error);
                    // Token is invalid, clear it
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setToken(null);
                    setUser(null);
                }
            }
            setIsLoading(false);
        };
        initializeAuth();
    }, []);

    const login = async (newToken: string) => {
        setToken(newToken);
        localStorage.setItem('token', newToken);
        try {
            const response = await api.get('/auth/me', {
                headers: { Authorization: `Bearer ${newToken}` },
            });
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
        } catch (error) {
            console.error('Failed to fetch user after login', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ token, user, login, logout, isLoading }}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
