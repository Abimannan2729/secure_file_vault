import React, { useState, useContext } from 'react';
import { validateEmail, validatePassword } from '../../utils/validateForm';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthContext from '../../context/AuthContext';

const Register = () => {
    const { register, sendOtp } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        phoneNumber: ''
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateEmail(formData.email) || !validatePassword(formData.password)) {
            toast.error("Invalid Input");
            return;
        }

        const regResult = await register(formData);
        if (regResult.success) {
            toast.success("Registration Successful. Sending OTP...");
            const otpResult = await sendOtp(formData.phoneNumber);
            if (otpResult.success) {
                navigate('/verify-otp', { state: { phoneNumber: formData.phoneNumber } });
            } else {
                toast.error("Failed to send OTP. Please try logging in.");
                navigate('/login');
            }
        } else {
            toast.error(regResult.message);
        }
    };

    return (
        <div className="auth-container">
            <h2>Register</h2>
            <form onSubmit={handleSubmit}>
                <input type="text" name="username" placeholder="Username" onChange={handleChange} required />
                <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
                <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
                <input type="text" name="phoneNumber" placeholder="Phone Number" onChange={handleChange} required />
                <button type="submit">Register</button>
            </form>
            <p>Already have an account? <Link to="/login">Login</Link></p>
        </div>
    );
};

export default Register;
