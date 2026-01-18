import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import { encryptFile, decryptFile } from '../utils/fileCrypto';
import FileCard from '../components/FileCard';

const Dashboard = () => {
    const { auth, logout } = useAuth();
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

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

    const onDrop = async (acceptedFiles) => {
        setUploading(true);
        // Process sequentially to avoid browser freeze on large files
        for (const file of acceptedFiles) {
            try {
                const reader = new FileReader();

                const uploadPromise = new Promise((resolve, reject) => {
                    reader.onload = async () => {
                        try {
                            const arrayBuffer = reader.result;
                            const { encryptedString, ivString } = encryptFile(arrayBuffer);
                            const encryptedBlob = new Blob([encryptedString], { type: 'text/plain' });

                            const formData = new FormData();
                            formData.append('file', encryptedBlob, file.name + '.enc');
                            formData.append('originalname', file.name);
                            formData.append('mimetype', file.type);
                            formData.append('iv', ivString);

                            await api.post('/files', formData);
                            resolve();
                        } catch (err) {
                            reject(err);
                        }
                    };
                    reader.onerror = reject;
                });

                reader.readAsArrayBuffer(file);
                await uploadPromise;

            } catch (err) {
                console.error("Upload failed", err);
                alert("Upload failed for " + file.name);
            }
        }
        await fetchFiles();
        setUploading(false);
    };

    const handleDownload = async (file, previewUrl = null) => {
        try {
            let blob;
            if (previewUrl) {
                // Use already decrypted blob from preview if available
                blob = await fetch(previewUrl).then(r => r.blob());
            } else {
                // Fetch and decrypt
                const response = await api.get(`/files/${file._id}`, { responseType: 'text' });
                const encryptedContent = response.data;
                const ivHex = response.headers['x-encryption-iv'];

                if (!ivHex) throw new Error("Missing IV in header");
                blob = decryptFile(encryptedContent, ivHex, file.mimeType);
            }

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.originalName);
            document.body.appendChild(link);
            link.click();
            link.remove();

            // Only revoke if we created it newly (not previewUrl)
            if (!previewUrl) {
                setTimeout(() => window.URL.revokeObjectURL(url), 100);
            }
        } catch (err) {
            console.error("Download/Decrypt failed", err);
            alert("Failed to decrypt file. Check console.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this file?")) return;
        try {
            await api.delete(`/files/${id}`);
            setFiles(current => current.filter(f => f._id !== id));
        } catch (err) {
            console.error("Delete failed", err);
            fetchFiles(); // Sync on error
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <div className="bg-blue-600 rounded-lg p-1.5 shadow-md">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-gray-800 tracking-tight">
                            Secure File Vault
                        </span>
                    </div>

                    <div className="flex items-center space-x-4 relative">
                        <span className="text-sm text-gray-600 hidden sm:block">
                            Welcome, <strong className="text-gray-900">{auth?.user?.username}</strong>
                        </span>

                        <div className="relative">
                            <button
                                onClick={() => setShowProfile(!showProfile)}
                                className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-white flex items-center justify-center font-bold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {auth?.user?.username?.charAt(0).toUpperCase()}
                            </button>

                            {showProfile && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10 cursor-default"
                                        onClick={() => setShowProfile(false)}
                                    ></div>
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-4 px-4 z-20 animate-fade-in-down">
                                        <h3 className="text-sm uppercase tracking-wide text-gray-400 font-semibold mb-3 pb-2 border-b border-gray-50">
                                            User Profile
                                        </h3>
                                        <div className="space-y-2 mb-4">
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium text-gray-900">Username:</span> {auth?.user?.username}
                                            </p>
                                            <p className="text-sm text-gray-600 truncate">
                                                <span className="font-medium text-gray-900">Email:</span> {auth?.user?.email}
                                            </p>
                                        </div>
                                        <button
                                            onClick={logout}
                                            className="w-full py-2 px-4 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium transition-colors text-sm"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Upload Zone */}
                <div
                    {...getRootProps()}
                    className={`
                        relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ease-in-out mb-12
                        ${isDragActive
                            ? 'border-blue-500 bg-blue-50 scale-[1.01] shadow-inner'
                            : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50'
                        }
                    `}
                >
                    <input {...getInputProps()} />

                    {uploading ? (
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-lg font-medium text-blue-600 animate-pulse">Encrypting & Uploading...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-700">
                                {isDragActive ? "Drop files now!" : "Upload Files Securely"}
                            </h3>
                            <p className="text-gray-500 max-w-sm mx-auto">
                                Check the magic! Files are encrypted locally with AES-256 before they ever leave your browser.
                            </p>
                        </div>
                    )}
                </div>

                {/* Files Section */}
                <section>
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="h-8 w-1.5 bg-blue-600 rounded-full"></div>
                        <h2 className="text-2xl font-bold text-gray-800">Your Secure Files</h2>
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                            {files.length}
                        </span>
                    </div>

                    {files.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                            <div className="text-gray-400 mb-2">No files uploaded yet.</div>
                            <p className="text-sm text-gray-500">Upload your first document to see it here.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {files.map(file => (
                                <FileCard
                                    key={file._id}
                                    file={file}
                                    onDownload={handleDownload}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default Dashboard;
