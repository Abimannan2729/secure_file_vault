const redisClient = require('../config/redis');
const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = async (phoneNumber, otp) => {
    try {
        await client.messages.create({
            to: phoneNumber,
            messagingServiceSid: process.env.TWILIO_MSG_SERVICE_SID,
            body: `Your verification code is ${otp}`
        });
        return true;
    } catch (error) {
        console.error('Twilio Error:', error);
        console.log(`[MOCK OTP] Sending OTP to ${phoneNumber}: ${otp}`);
        return true; // Allow flow to continue even if Twilio fails
    }
};

const storeOTP = async (phoneNumber, otp) => {
    // Expires in 5 minutes (300 seconds)
    await redisClient.setEx(`otp:${phoneNumber}`, 300, otp);
};

const verifyOTP = async (phoneNumber, otp) => {
    const storedOtp = await redisClient.get(`otp:${phoneNumber}`);
    return storedOtp === otp;
};

module.exports = { generateOTP, sendOTP, storeOTP, verifyOTP };
