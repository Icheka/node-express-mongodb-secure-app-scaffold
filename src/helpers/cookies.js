const setTokenCookie = (token, req, res) => {
    const cookie = req.cookies['auth'];
    if (cookie) {
        res.clearCookie('auth');
    }

    console.log(`Set auth cookie.`);

    res.cookie('auth', token, {
        maxAge: (3600 * 2 * 1000),
        httpOnly: false,
        sameSite: false,
        secure: false
    });
}


module.exports = {
    setTokenCookie
}