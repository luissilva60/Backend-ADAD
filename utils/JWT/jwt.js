import jwt from "jsonwebtoken";

// Middleware to verify JWT
function verifyJwt(req, res, next) {
    const token = req.header('Authorization');
    if (!token) return res.status(401).send('Access Denied');

    try {
        const verified = jwt.verify(token, 'wcGBBhaRBJnuWRw');
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).send('Invalid Token');
    }
}

export default verifyJwt;
