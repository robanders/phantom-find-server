const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");

const createRefreshToken = user => {
    return jwt.sign({ userId: user.id, tokenVersion: user.tokenVersion}, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "7d"
    });
}

const createAccessToken = user => {
    return jwt.sign({ userId: user.id }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m"
    });
};

const createEmailToken = user => {
    return jwt.sign({ userId: user.id, tokenVersion: user.tokenVersion}, process.env.EMAIL_TOKEN_SECRET, {
        expiresIn: "7d"
    });
}

const validateHuman = async (token) => {
    const secret = process.env.RECAPTCHA_SECRET;
    const response = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`, {
        method: "POST"
    });
    const data = await response.json();
    return data.success;
}

module.exports = { createAccessToken, createRefreshToken, createEmailToken, validateHuman }