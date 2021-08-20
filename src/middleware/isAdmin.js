const admin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(406).send({ message: `Forbidden` });

    return next();
}

module.exports = admin;