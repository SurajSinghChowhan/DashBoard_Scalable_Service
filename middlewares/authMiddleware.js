const jwt = require("jsonwebtoken");
const jwtConfig = require("../config/jwt");

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    console.log("Token: ", req.headers.authorization);
    if (!token) return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "No token, authorization denied"
    });

    try {
        const decoded = jwt.verify(token, jwtConfig.secret);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({
            status: "error",
            statusCode: 401,
            message: "Token is not valid"
        });
    }
};

module.exports = authMiddleware;
