import React, { useState, useEffect } from 'react';
import { decryptFile } from '../utils/fileCrypto';
import api from '../services/api';

const FileCard = ({ file, onDownload, onDelete }) => {
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const isImage = file.mimeType.startsWith('image/');

    useEffect(() => {
        let isMounted = true;

        const fetchAndDecryptImage = async () => {
            if (!isImage) return;

            setLoadingPreview(true);
            try {
                // Fetch encrypted content
                const response = await api.get(`/files/${file._id}`, { responseType: 'text' });
                const encryptedContent = response.data;
                const ivHex = response.headers['x-encryption-iv'];

                if (encryptedContent && ivHex) {
                    const blob = decryptFile(encryptedContent, ivHex, file.mimeType);
                    const url = URL.createObjectURL(blob);

                    if (isMounted) {
                        setPreviewUrl(url);
                    }
                }
            } catch (err) {
                console.error("Failed to load preview for", file.originalName, err);
            } finally {
                if (isMounted) setLoadingPreview(false);
            }
        };

        fetchAndDecryptImage();

        return () => {
            isMounted = false;
            // Cleanup object URL
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [file, isImage]); // Only re-run if file changes

    // Clean up URL when component unmounts or url changes
    // (Handled in return cleanup above, but need reference to current previewUrl)

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col group h-full">
            {/* Preview/Thumbnail Area */}
            <div className="h-48 bg-gray-50 flex items-center justify-center border-b border-gray-100 relative overflow-hidden">
                {isImage ? (
                    loadingPreview ? (
                        <div className="animate-pulse flex flex-col items-center">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                            <span className="text-xs text-gray-400">Decrypting...</span>
                        </div>
                    ) : previewUrl ? (
                        <img
                            src={previewUrl}
                            alt={file.originalName}
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="text-gray-300 flex flex-col items-center">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs mt-1">Preview failed</span>
                        </div>
                    )
                ) : (
                    <div className="text-gray-300 flex flex-col items-center">
                        <svg className="w-16 h-16 group-hover:text-primary/50 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                )}

                {/* Overlay actions on hover (optional enhancement, sticking to buttons below for now) */}
            </div>

            {/* Content Area */}
            <div className="p-4 flex flex-col flex-grow justify-between">
                <div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-1 truncate" title={file.originalName}>
                        {file.originalName}
                    </h3>
                    <div className="flex items-center text-xs text-gray-500 space-x-2">
                        <span>{(file.size / 1024).toFixed(2)} KB</span>
                        <span>•</span>
                        <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                    <button
                        onClick={() => onDownload(file, previewUrl)} // Pass previewUrl to avoid re-decrypting if possible? Wait, download needs full quality maybe? logic in dashboard.
                        className="flex items-center justify-center px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                    >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                    </button>
                    <button
                        onClick={() => onDelete(file._id)}
                        className="flex items-center justify-center px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FileCard;
