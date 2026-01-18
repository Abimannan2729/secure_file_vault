import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Register from './components/Auth/Register';
import VerifyOtp from './components/Auth/VerifyOtp';
import Login from './components/Auth/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/common/ProtectedRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
    return (
        <>
            <Routes>
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/verify-otp" element={<VerifyOtp />} />

                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Route>
            </Routes>
            <ToastContainer />
        </>
    );
}

export default App;
