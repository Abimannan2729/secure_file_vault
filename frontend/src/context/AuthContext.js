import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('accessToken');
            if (token) {
                try {
                    const res = await api.get('/users/profile');
                    setAuth({ user: res.data, accessToken: token });
                } catch (err) {
                    console.log('User not authenticated');
                }
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    const login = (data) => {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        setAuth({ user: data.user, accessToken: data.accessToken });
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setAuth(null);
    };

    const sendOtp = async (phoneNumber) => {
        try {
            await api.post('/auth/send-otp', { phoneNumber });
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to send OTP'
            };
        }
    };

    const verifyOtp = async (phoneNumber, otp) => {
        try {
            const res = await api.post('/auth/verify-otp', { phoneNumber, otp });
            // If verification results in a login/token, update auth state
            if (res.data.accessToken) {
                login(res.data);
            }
            return { success: true, data: res.data };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Verification failed'
            };
        }
    };

    const register = async (formData) => {
        try {
            await api.post('/auth/register', formData);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    return (
        <AuthContext.Provider value={{ auth, setAuth, login, logout, loading, sendOtp, verifyOtp, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
