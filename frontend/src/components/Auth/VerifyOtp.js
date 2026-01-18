import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const VerifyOtp = () => {
    const { verifyOtp, sendOtp } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();

    // Attempt to get phoneNumber from navigation state, fallback or handle error if missing
    const phoneNumber = location.state?.phoneNumber;

    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        if (!phoneNumber) {
            setError('Phone number not found. Please try logging in again.');
        }
    }, [phoneNumber]);

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!phoneNumber) {
            setError('Phone number is missing.');
            return;
        }

        const result = await verifyOtp(phoneNumber, otp);
        if (result.success) {
            navigate('/dashboard'); // or wherever you want to redirect
        } else {
            setError(result.message);
        }
    };

    const handleResend = async () => {
        setError('');
        setMessage('');

        if (!phoneNumber) {
            setError('Phone number is missing.');
            return;
        }

        const result = await sendOtp(phoneNumber);
        if (result.success) {
            setMessage('OTP resent successfully.');
            setTimer(30); // Start 30s countdown
        } else {
            setError(result.message);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <h2>Verify OTP</h2>
            {phoneNumber && <p>Sent to: {phoneNumber}</p>}

            <form onSubmit={handleVerify}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Enter OTP:</label>
                    <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter OTP"
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>

                {error && <p style={{ color: 'red' }}>{error}</p>}
                {message && <p style={{ color: 'green' }}>{message}</p>}

                <button
                    type="submit"
                    style={{ width: '100%', padding: '10px', backgroundColor: '#007BFF', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                    Verify
                </button>
            </form>

            <div style={{ marginTop: '15px', textAlign: 'center' }}>
                <p>Didn't receive the code?</p>
                <button
                    onClick={handleResend}
                    disabled={timer > 0}
                    style={{
                        padding: '5px 10px',
                        backgroundColor: timer > 0 ? '#ccc' : 'transparent',
                        color: timer > 0 ? '#666' : '#007BFF',
                        border: timer > 0 ? '1px solid #999' : 'none',
                        cursor: timer > 0 ? 'not-allowed' : 'pointer',
                        textDecoration: timer > 0 ? 'none' : 'underline'
                    }}
                >
                    {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
                </button>
            </div>
        </div>
    );
};

export default VerifyOtp;
