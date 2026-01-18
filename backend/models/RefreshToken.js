const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    expires: {
        type: Date,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    },
    revoked: {
        type: Date
    },
    replacedByToken: {
        type: String
    }
});

refreshTokenSchema.virtual('isExpired').get(function () {
    return Date.now() >= this.expires;
});

refreshTokenSchema.virtual('isActive').get(function () {
    return !this.revoked && !this.isExpired;
});

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
