import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import CryptoJS from 'crypto-js';
import useAuth from './hooks/useAuth';
import api from './services/api';
import './components/Dashboard.css'; // Import the new CSS

const Dashboard = () => {
    const { auth, logout } = useAuth();
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    // In a real app, this should be derived from user's password or a secure key management system
    const ENCRYPTION_KEY = 'secure-file-vault-secret-key-123';

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            const res = await api.get('/files');
            setFiles(res.data);
        } catch (err) {
            console.error("Failed to fetch files", err);
        }
    };

    const convertWordArrayToUint8Array = (wordArray) => {
        const len = wordArray.sigBytes;
        const u8 = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            u8[i] = (wordArray.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
        }
        return u8;
    };

    const onDrop = async (acceptedFiles) => {
        setUploading(true);
        for (const file of acceptedFiles) {
            try {
                const reader = new FileReader();
                reader.onload = async () => {
                    const arrayBuffer = reader.result;
                    const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
                    const iv = CryptoJS.lib.WordArray.random(16);

                    const encrypted = CryptoJS.AES.encrypt(wordArray, ENCRYPTION_KEY, { iv: iv });
                    const encryptedString = encrypted.toString();
                    const encryptedBlob = new Blob([encryptedString], { type: 'text/plain' });

                    const formData = new FormData();
                    formData.append('file', encryptedBlob, file.name + '.enc');
                    formData.append('originalname', file.name);
                    formData.append('mimetype', file.type);
                    formData.append('iv', iv.toString());

                    await api.post('/files', formData);
                    fetchFiles();
                };
                reader.readAsArrayBuffer(file);
            } catch (err) {
                console.error("Upload failed", err);
                alert("Upload failed for " + file.name);
            }
        }
        setUploading(false);
    };

    const handleDownload = async (file) => {
        try {
            const response = await api.get(`/files/${file._id}`, { responseType: 'text' });
            const encryptedContent = response.data;
            const ivHex = response.headers['x-encryption-iv'];

            if (!ivHex) throw new Error("Missing IV in header");

            const iv = CryptoJS.enc.Hex.parse(ivHex);
            const decrypted = CryptoJS.AES.decrypt(encryptedContent, ENCRYPTION_KEY, { iv: iv });
            const typedArray = convertWordArrayToUint8Array(decrypted);

            const blob = new Blob([typedArray], { type: file.mimeType });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.originalName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Download/Decrypt failed", err);
            alert("Failed to decrypt file. Check console.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this file?")) return;
        try {
            await api.delete(`/files/${id}`);
            fetchFiles();
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="brand-logo">Secure File Vault</div>

                <div className="user-section">
                    <span className="welcome-text">
                        Welcome, <strong>{auth?.user?.username}</strong>
                    </span>

                    <div
                        className="user-avatar"
                        onClick={() => setShowProfile(!showProfile)}
                        title="Click to view profile"
                    >
                        {auth?.user?.username?.charAt(0).toUpperCase()}
                    </div>

                    {showProfile && (
                        <div className="profile-dropdown">
                            <h3>User Profile</h3>
                            <p className="profile-detail"><strong>Username:</strong> {auth?.user?.username}</p>
                            <p className="profile-detail"><strong>Email:</strong> {auth?.user?.email}</p>
                            <button className="logout-btn" onClick={logout}>
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <div className="dashboard-content">
                <div
                    {...getRootProps()}
                    className={`upload-zone ${isDragActive ? 'active' : ''}`}
                >
                    <input {...getInputProps()} />
                    {uploading ? (
                        <p className="uploading-text">Encrypting & Uploading...</p>
                    ) : (
                        <div>
                            <p className="upload-text">
                                {isDragActive ? "Drop files now!" : "Upload Files Securely"}
                            </p>
                            <p className="upload-subtext">
                                Drag & drop or click to browse. Files are AES-256 encrypted before upload.
                            </p>
                        </div>
                    )}
                </div>

                <section>
                    <h2 className="files-section-title">Your Secure Files</h2>

                    {files.length === 0 ? (
                        <div className="empty-state">
                            No files uploaded yet. Start by dragging a file above.
                        </div>
                    ) : (
                        <div className="files-grid">
                            {files.map(file => (
                                <div key={file._id} className="file-card">
                                    <div className="file-info">
                                        <span className="file-name">{file.originalName}</span>
                                        <span className="file-meta">
                                            {(file.size / 1024).toFixed(2)} KB • {new Date(file.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="file-actions">
                                        <button
                                            className="btn btn-download"
                                            onClick={() => handleDownload(file)}
                                        >
                                            Download
                                        </button>
                                        <button
                                            className="btn btn-delete"
                                            onClick={() => handleDelete(file._id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default Dashboard;
