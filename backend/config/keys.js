module.exports = {
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    twilio: {
        sid: process.env.TWILIO_SID,
        token: process.env.TWILIO_AUTH_TOKEN,
        msg_sid: process.env.TWILIO_MSG_SERVICE_SID,
        phone: process.env.TWILIO_PHONE_NUMBER
    }
};
