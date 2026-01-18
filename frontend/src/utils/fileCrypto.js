import CryptoJS from 'crypto-js';

// In a real app, this should be from env vars or key management
const DEFAULT_KEY = 'secure-file-vault-secret-key-123';

export const convertWordArrayToUint8Array = (wordArray) => {
    const len = wordArray.sigBytes;
    const u8 = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        u8[i] = (wordArray.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    }
    return u8;
};

export const encryptFile = (arrayBuffer, key = DEFAULT_KEY) => {
    const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
    const iv = CryptoJS.lib.WordArray.random(16);

    // Encrypt
    const encrypted = CryptoJS.AES.encrypt(wordArray, key, { iv: iv });
    const encryptedString = encrypted.toString();
    const ivString = iv.toString();

    return {
        encryptedString,
        ivString
    };
};

export const decryptFile = (encryptedContent, ivHex, mimeType, key = DEFAULT_KEY) => {
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    const decrypted = CryptoJS.AES.decrypt(encryptedContent, key, { iv: iv });
    const typedArray = convertWordArrayToUint8Array(decrypted);

    return new Blob([typedArray], { type: mimeType });
};
