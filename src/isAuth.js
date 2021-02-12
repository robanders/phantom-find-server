const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authorization = req.headers['authorization'];

    if(!authorization) {
        req.isAuth = false;
        return next();
    }

    const token = authorization.split(" ")[1];
    if(!token || token == '') {
        req.isAuth = false;
        return next();
    }
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
        req.isAuth = false;
        return next();
    }
    req.isAuth = true;
    req.userId = decodedToken.userId;
    next();
}