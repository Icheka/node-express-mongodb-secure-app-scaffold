const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = (req, res, next) => {
    const token = req.body.token || req.query.token || req.headers["x-access-token"] || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : false);

    if (!token || token == null) return res.status(403).send('A token is required for authentication');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log(decoded.role);
    } catch (e) {
        console.log(e)
        return res.status(401).send({
            message: `Invalid access token`
        });
    }

    return next();
}

module.exports = auth;