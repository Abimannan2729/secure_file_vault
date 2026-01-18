const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const File = require('../models/File');
const router = express.Router();

// Middleware to check authentication (reusing existing auth logic if available, 
// otherwise assuming req.user is populated by a previous middleware)
// IMPORTANT: You need to ensure the 'auth' middleware is imported correctly.
// Middleware to check authentication
const authMiddleware = require('../middleware/auth');


const upload = multer(); // Memory storage for encrypted files

// Upload encrypted file
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const db = mongoose.connection.db;
        const bucket = new GridFSBucket(db, { bucketName: 'files' });
        const { originalname, mimetype, iv } = req.body;

        // Create an upload stream to GridFS
        const uploadStream = bucket.openUploadStream(`${req.user.id}_${Date.now()}_${originalname}`, {
            metadata: { userId: req.user.id, iv }
        });

        const fileId = uploadStream.id;

        // Pipe the buffer to GridFS
        uploadStream.end(req.file.buffer);

        uploadStream.on('finish', async () => {
            const fileDoc = new File({
                filename: fileId.toString(),
                originalName: originalname,
                size: req.file.size,
                mimeType: mimetype,
                userId: req.user.id,
                fileId,
                iv
            });
            await fileDoc.save();
            res.json({ fileId: fileDoc._id, filename: originalname, size: req.file.size });
        });

        uploadStream.on('error', (err) => {
            res.status(500).json({ message: 'Error uploading file', error: err.message });
        });

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// List user's files
router.get('/', authMiddleware, async (req, res) => {
    try {
        const files = await File.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .select('originalName size createdAt _id mimeType');
        res.json(files);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching files', error: err.message });
    }
});

// Download file (encrypted stream)
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const file = await File.findOne({ _id: req.params.id, userId: req.user.id });
        if (!file) return res.status(404).json({ msg: 'File not found' });

        const db = mongoose.connection.db;
        const bucket = new GridFSBucket(db, { bucketName: 'files' });

        const downloadStream = bucket.openDownloadStream(file.fileId);

        res.set('Content-Type', file.mimeType);
        res.set('Content-Disposition', `attachment; filename="${file.originalName}"`);
        // Expose IV in header so client can decrypt
        res.set('x-encryption-iv', file.iv);

        downloadStream.pipe(res);

        downloadStream.on('error', (err) => {
            res.status(404).json({ message: 'File not found in storage' });
        });
    } catch (err) {
        res.status(500).json({ message: 'Error downloading file', error: err.message });
    }
});

// Delete file
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const file = await File.findOne({ _id: req.params.id, userId: req.user.id });
        if (!file) return res.status(404).json({ msg: 'File not found' });

        const db = mongoose.connection.db;
        const bucket = new GridFSBucket(db, { bucketName: 'files' });

        await bucket.delete(file.fileId);
        await File.findByIdAndDelete(file._id);
        res.json({ msg: 'File deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting file', error: err.message });
    }
});

module.exports = router;
