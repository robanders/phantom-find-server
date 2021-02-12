const sendRefreshToken = (res, token) => {
    res.cookie("lid", token, {
        httpOnly: true,
        path: '/refresh_token'
    });
}

module.exports = { sendRefreshToken };