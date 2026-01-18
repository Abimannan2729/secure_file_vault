const express = require('express');
const router = express.Router();
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const jwt = require('jsonwebtoken');
const { registerSchema, loginSchema } = require('../utils/validators');
const { generateRefreshToken } = require('../services/refreshTokenService');
const { generateOTP, sendOTP, storeOTP, verifyOTP } = require('../services/otpService');
const { loginLimiter } = require('../middleware/rateLimit');

router.post('/register', async (req, res) => {
    try {
        const { error } = registerSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { username, email, password, phoneNumber } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const user = new User({ username, email, password, phoneNumber });
        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { error } = loginSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const accessToken = jwt.sign({ id: user._id }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRY });
        const refreshToken = generateRefreshToken(user);
        await refreshToken.save();

        res.json({
            accessToken,
            refreshToken: refreshToken.token,
            user: { id: user._id, username: user.username, email: user.email }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Token is required' });

    const token = await RefreshToken.findOne({ token: refreshToken }).populate('user');
    if (!token || !token.isActive) return res.status(403).json({ message: 'Invalid or expired refresh token' });

    const newAccessToken = jwt.sign({ id: token.user._id }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRY });
    const newRefreshToken = generateRefreshToken(token.user);

    token.revoked = Date.now();
    token.replacedByToken = newRefreshToken.token;
    await token.save();
    await newRefreshToken.save();

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken.token });
});

router.post('/send-otp', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        if (!phoneNumber) return res.status(400).json({ message: 'Phone number is required' });

        const otp = generateOTP();
        const sent = await sendOTP(phoneNumber, otp);

        if (sent) {
            await storeOTP(phoneNumber, otp);
            res.json({ message: 'OTP sent successfully' });
        } else {
            res.status(500).json({ message: 'Failed to send OTP' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/verify-otp', async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;
        if (!phoneNumber || !otp) return res.status(400).json({ message: 'Phone number and OTP are required' });

        const isValid = await verifyOTP(phoneNumber, otp);
        if (isValid) {
            // Find user by phone number and log them in
            const user = await User.findOne({ phoneNumber });

            // If user doesn't exist, you might want strict flows, but for now we just verify
            if (!user) {
                return res.json({ message: 'OTP verified', userFound: false });
            }

            const accessToken = jwt.sign({ id: user._id }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRY });
            const refreshToken = generateRefreshToken(user);
            await refreshToken.save();

            res.json({
                message: 'OTP Verified',
                accessToken,
                refreshToken: refreshToken.token,
                user: { id: user._id, username: user.username, email: user.email }
            });
        } else {
            res.status(400).json({ message: 'Invalid OTP' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/logout', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        // In a real scenario you might validate the token first
        // Here we just mark it as revoked if found
        if (refreshToken) {
            const token = await RefreshToken.findOne({ token: refreshToken });
            if (token) {
                token.revoked = Date.now();
                await token.save();
            }
        }
        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
