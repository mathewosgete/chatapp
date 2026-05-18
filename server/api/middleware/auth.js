const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = (req, res, next) => {
    try {
        const token =req.header("x-auth-token");
        if (!token) {
            return res.status(401).json({ message: "No token, authorization denied" });
        }
        const verified =jwt.verify(token, process.env.JWT_SECRET);
       /// console.log("Token verified:", verified);
        if(!verified) {
            return res.status(401).json({ message: "Token verification failed, authorization denied" });
        }
       req.id = verified.userId;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token has expired, please log in again" });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid token, authorization denied" });
        }
        console.error("Authentication error:", err);
        res.status(500).json({ message: "Server error during authentication" });
    }
}; 
    


module.exports = auth;