// Basic structure - actual logic often handled in service
const verifyRefreshTokenStructure = (req, res, next) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh Token is required' });
    }
    next();
};

module.exports = verifyRefreshTokenStructure;
