# Secure File Vault

A robust MERN stack application designed for secure file storage and management. It features military-grade encryption, advanced authentication (JWT + Refresh Tokens), and OTP verification, ensuring your data remains private and protected.

## 🚀 Features

### 🔐 Security & Authentication
- **Dual-Token Authentication**: Secure access using short-lived JWT Access Tokens and long-lived Refresh Tokens (stored in HTTP-only cookies).
- **Two-Factor Authentication (2FA)**: OTP verification via SMS (Twilio integration) for sensitive actions.
- **Client-Side Encryption**: Files are encrypted in the browser using AES *before* upload, ensuring the server never sees the raw file content.
- **Secure Storage**: Encrypted files are stored using MongoDB GridFS.

### ⚡ Performance & UX
- **Redis Caching**: Optimized performance for OTP storage and session management.
- **Responsive Dashboard**: User-friendly interface built with React and Tailwind CSS.
- **Toast Notifications**: Real-time feedback for user actions.
- **Protected Routes**: Secure navigation guards for authenticated views.

## 🛠️ Tech Stack

### Frontend
- **React**: UI Library
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP Client
- **Crypto-JS**: Client-side AES encryption
- **React Router**: Navigation and Routing

### Backend
- **Node.js & Express**: API Server
- **MongoDB & Mongoose**: Database & Object Modeling (GridFS for files)
- **Redis**: In-memory data store for caching and OTPs
- **Twilio**: SMS/OTP Service
- **JWT**: JSON Web Tokens for stateless authentication

## 📋 Prerequisites

Before running the project, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) (Local or Atlas Connection String)
- [Redis](https://redis.io/download/) (Running on default port 6379 or configured URL)

## 🔧 Installation & Setup

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment Variables:
   - Create a `.env` file in the `backend` directory.
   - Add the following keys (see `.env.example` for reference):
   
     PORT=5000
     MONGO_URI=mongodb://localhost:27017/secure-vault
     REDIS_URL=redis://localhost:6379
     
     JWT_ACCESS_SECRET=your_super_secret_access_key
     JWT_REFRESH_SECRET=your_super_secret_refresh_key
     JWT_ACCESS_EXPIRY=15m
     JWT_REFRESH_EXPIRY=7d
     
     TWILIO_SID=your_twilio_sid
     TWILIO_AUTH_TOKEN=your_twilio_auth_token
     TWILIO_MSG_SERVICE_SID=your_messaging_service_sid
     ```
4. Start the server:
   ```bash
   npm start
   # or for development with nodemon:
   npm run dev
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   npm start
   ```

## 🔒 Security Notes
- Files are encrypted on the client side using a unique IV for each file.
- The IV is stored alongside the file metadata to facilitate decryption upon download.
- OTPs are cached in Redis with a 5-minute expiration time.
