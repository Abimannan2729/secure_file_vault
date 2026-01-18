const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    size: { type: Number, required: true },
    mimeType: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
    iv: { type: String, required: true }, // AES IV used for encryption
}, { timestamps: true });

module.exports = mongoose.model('File', fileSchema);
