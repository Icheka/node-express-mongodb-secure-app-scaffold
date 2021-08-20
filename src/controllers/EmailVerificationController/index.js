const EmailVerificationModel = require('../../models/EmailVerificationModel');
const UserModel = require('../../models/UserModel');
const jwt = require('jsonwebtoken');
const crypt = require('../../helpers/crypt');


class EmailVerificationController {
    async markAsVerified(token) {
        const user = await jwt.verify(token, process.env.JWT_SECRET, (err, data) => {
            if (err) return null;
            return data;
        });
        if (!user) return null;
        const t = await this.isLinkValid(token);

        if (!t) return t;

        if (t.email == user.email) {
            const v = await UserModel.findOne({ email: t.email })
                .then(data => data)
                .catch(err => null);
            if (!v) return false;
            v.isEmailVerified = true;
            v.save();

            const p = await EmailVerificationModel.findOne({ link: token })
                .then(data => {
                    data.isUsed = true;
                    data.save();
                })
                .catch(err => {
                    console.log(err);
                    return null;
                });
            return true;
        } else {
            return false;
        }
    }

    async save(email, info) {
        let v;

        try {
            v = jwt.sign({
                email,
                info,
            },
                process.env.JWT_SECRET,
                {
                    expiresIn: '1h'
                }
            );
        } catch (e) {
            return null;
        }

        const m = {
            link: v,
            isUsed: false,
        }

        const e = new EmailVerificationModel(m);
        e.isUsed = false;
        e.save();
        return v;
    }

    async getByLink(link) {
        if (!link) return null;

        return await EmailVerificationModel.findOne({ link })
            .then(data => data)
            .catch(err => {
                console.log(err);
                return null;
            });
    }

    async isLinkValid(link) {
        const possibleLink = await this.getByLink(link);

        if (!possibleLink) return false;

        if (possibleLink.isUsed == true) return null;

        try {
            let v = await jwt.verify(link, process.env.JWT_SECRET, (err, data) => {
                if (err) return null;
                return data;
            });
            let u = await jwt.verify(possibleLink.link, process.env.JWT_SECRET, (err, data) => {
                if (err) return null;
                return data;
            });

            if (!u || !v) return null;

            if (v.email == u.email) return u;

            return false;
        } catch (e) {
            console.log('e ->', e);
            return false;
        }
    }
}


module.exports = EmailVerificationController;