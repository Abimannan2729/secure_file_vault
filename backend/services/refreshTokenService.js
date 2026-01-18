const RefreshToken = require('../models/RefreshToken');
const crypto = require('crypto');

const generateRefreshToken = (user) => {
    return new RefreshToken({
        user: user._id,
        token: crypto.randomBytes(40).toString('hex'),
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        // createdByIp: ipAddress
    });
};

module.exports = { generateRefreshToken };
