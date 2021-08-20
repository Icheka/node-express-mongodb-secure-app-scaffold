const crypt = require('../../helpers/crypt');
const UserModel = require('../../models/UserModel');
const { newUserSchema, existingUserSchema, updateProfileImageSchema, kycObjectSchema, newUserWithGoogleSchema } = require('./joiSchemas');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { setTokenCookie } = require('../../helpers/cookies');
const sendEmail = require('../../utils/sendEmail');
const EmailVerificationController = require('../EmailVerificationController');
const emailVerificationController = new EmailVerificationController();


class UserController {
    async doKyc(kyc) {
        const v = kycObjectSchema.validate(kyc);
        if (v.error) return { code: 1, message: `Invalid KYC information` };

        kyc.documents = JSON.stringify(kyc.documents);

        return await UserModel.findOne({ email: kyc.email })
            .then(data => {
                data.address = kyc.address;
                data.city = kyc.city;
                data.countryOfResidence = kyc.countryOfResidence;
                data.dob = kyc.dob;
                data.nationality = kyc.nationality;
                data.zip = kyc.zip;
                data.phone = kyc.phone;
                data.selfie = kyc.selfie;
                data.documents = kyc.documents;
                // change this to -> pending later
                data.kycStatus = 'done';
                // remove this line later
                data.isAccountVerified = true;

                data.save();
                return { code: 0, message: `KYC completed successfully` };
            })
            .catch(err => ({ code: 2, message: `A server error occurred` }));

    }

    async verifyEmailFromLink(token) {
        const r = await emailVerificationController.markAsVerified(token);

        if (r == false) {
            return { code: 1, message: `Invalid link` };
        } else if (r == null) {
            return { code: 2, message: `Link already used` };
        }
        return { code: 0, message: `Valid link` };
    }

    async createUserWithFacebook(user) {
        // is user object valid?
        const v = newUserWithGoogleSchema.validate(user);
        if (v.error) return { code: 1, message: v.error };

        // does user exist?
        const possibleUser = await this.doesUserExist(user.email);

        if (possibleUser === null) return { code: 4, message: `An error occurred` };
        if (possibleUser) return { code: 2, message: `A user account is already registered with this email` };
        // return ({ code: 0, message: `User account created successfully` });
        // save user
        user.isEmailVerified = false;
        user.signupMethod = 'facebook-auth';
        user = new UserModel(user);
        // user.save();

        let verificationLink = await emailVerificationController.save(user.email, 'withoutAuth');
        verificationLink = process.env.APP_DOMAIN + '/users/verify-email?qr=' + verificationLink;

        const mailObj = {
            address: user.email,
            subject: 'Verify Your Email on Bitcyclin',
            payload: { name: user.firstname, verificationLink: verificationLink },
            template: 'VerifyEmailWithPassword.hbs',
        }
        await sendEmail(mailObj);

        return ({ code: 0, message: `User account created successfully` });
    }

    async createUserWithGoogle(user) {
        // is user object valid?
        const v = newUserWithGoogleSchema.validate(user);
        if (v.error) return { code: 1, message: v.error };

        // does user exist?
        const possibleUser = await this.doesUserExist(user.email);

        if (possibleUser === null) return { code: 4, message: `An error occurred` };
        if (possibleUser) return { code: 2, message: `A user account is already registered with this email` };
        // return ({ code: 0, message: `User account created successfully` });
        // save user
        user.isEmailVerified = false;
        user.signupMethod = 'google-auth';
        user = new UserModel(user);
        // user.save();

        let verificationLink = await emailVerificationController.save(user.email, 'withoutAuth');
        verificationLink = process.env.APP_DOMAIN + '/users/verify-email?qr=' + verificationLink;

        const mailObj = {
            address: user.email,
            subject: 'Verify Your Email on Bitcyclin',
            payload: { name: user.firstname, verificationLink: verificationLink },
            template: 'VerifyEmailWithPassword.hbs',
        }
        console.log(await sendEmail(mailObj));

        return ({ code: 0, message: `User account created successfully` });
    }

    async changePassword(id, oldPassword, newPassword) {

        return await UserModel.findOne({ _id: id })
            .then(async (data) => {
                const h = await crypt.compare(oldPassword, data.pass);
                if (!h) return { code: 2, message: `Passwords do not match!` };

                const pass = await crypt.hash(newPassword);
                if (!pass) return { code: 1, message: `An error occurred on the server` };


                data.pass = pass;
                data.save();
                return { code: 0, message: `Success!` };
            })
            .catch(err => {
                console.log(err);
                return { code: 1, messae: `An error occurred` };
            });
    }

    async getUserDataClean(id) {
        return await UserModel.findOne({ _id: id })
            .then(async (data) => {
                const u = this.cleanUser(data._doc);

                return u;
            })
            .catch(err => {
                console.log('Error ', err);
                return null;
            });
    }

    async updateProfilePicture(user) {
        const v = updateProfileImageSchema.validate(user);
        if (v.error) return { code: 1, message: v.error };

        await UserModel.findOne({ email: user.email }, (err, doc) => {
            doc.image = user.image;
            doc.save();
        });

        return { code: 0, message: `Profile picture updated successfully` };
    }

    async loginWithOAuth(email, req, res) {
        // does user exist?
        const possibleUser = await this.fetchOne(email);
        if (!possibleUser) return { code: 2, message: `The email or password is incorrect` };

        // since user exists, is this a non-ByEmail account?
        if (!possibleUser.googleId && !possibleUser.facebookId) return { code: 5, message: `Invalid login. OAuth token does not exist` };

        // create access token and push
        const accessToken = jwt.sign({
            id: possibleUser._id, email: possibleUser.email, role: `user`
        },
            process.env.JWT_SECRET,
            {
                expiresIn: '2h'
            }
        );

        setTokenCookie(accessToken, req, res);

        const user = { ...possibleUser['_doc'] };

        // each login event should be logged
        // the 'login' field is an array of unmarshalled JSON
        const logins = JSON.parse(user.logins || '[]');
        logins.push({
            timestamp: new Date(),
            ip: req.ip,
            summary: 'genuine'
        });
        user.logins = JSON.stringify(logins);
        possibleUser.logins = JSON.stringify(logins);
        // save this user before deleting fields
        possibleUser.save();

        delete user['pass'];
        delete user['_id'];
        delete user['__v'];
        user['token'] = accessToken;
        return { code: 0, message: user };

    }

    async login(user, req, res) {
        // is user object valid?
        const v = existingUserSchema.validate(user);
        if (v.error) return { code: 1, message: v.error };

        // does user exist?
        const possibleUser = await this.fetchOne(user.email);
        if (!possibleUser) return { code: 2, message: `The email or password is incorrect` };

        // since user exists, do passwords match?
        const p = await crypt.compare(user.password, possibleUser.pass);
        if (!p) return { code: 2, message: `The email or password is incorrect` };

        // since passwords match, is this account verified
        if (!possibleUser.isEmailVerified) return { code: 4, message: `This email has not been verified` };

        // create access token and push
        const accessToken = jwt.sign({
            id: possibleUser._id, email: possibleUser.email, role: `user`
        },
            process.env.JWT_SECRET,
            {
                expiresIn: '2h'
            }
        );
        setTokenCookie(accessToken, req, res);

        user = { ...possibleUser['_doc'] };

        // each login event should be logged
        // the 'login' field is an array of unmarshalled JSON
        const logins = JSON.parse(user.logins || '[]');
        logins.push({
            timestamp: new Date(),
            ip: req.ip,
            summary: 'genuine'
        });
        user.logins = JSON.stringify(logins);
        possibleUser.logins = JSON.stringify(logins);
        // save this user before deleting fields
        possibleUser.save();

        delete user['pass'];
        delete user['_id'];
        delete user['__v'];
        user['token'] = accessToken;
        return { code: 0, message: user };

    }

    async createUser(user) {
        // is user object valid?
        const v = newUserSchema.validate(user);
        if (v.error) return { code: 1, message: v.error };

        // console.log(process.env.FROM_EMAIL)
        // console.log(process.env.EMAIL_USERNAME)
        // console.log(process.env.EMAIL_PASSWORD)
        // return { code: 0, message: `` };

        // does user exist?
        const possibleUser = await this.doesUserExist(user.email);

        if (possibleUser === null) return { code: 4, message: `An error occurred` };
        if (possibleUser) return { code: 2, message: `A user account is already registered with this email` };

        // hash password
        const pass = await crypt.hash(user.password);
        if (!pass) return { code: 3, message: `An error occurred` };

        // save user
        delete user.password;
        user.pass = pass;
        user.isEmailVerified = false;
        user.signupMethod = 'email';

        user = new UserModel(user);
        user.save();

        let verificationLink = await emailVerificationController.save(user.email, 'withoutAuth');

        verificationLink = process.env.APP_DOMAIN + '/users/verify-email?qr=' + verificationLink;

        const mailObj = {
            address: user.email,
            subject: 'Verify Your Email on Bitcyclin',
            payload: { name: user.firstname, verificationLink: verificationLink },
            template: 'VerifyEmailWithoutPassword.hbs',
        }
        console.log(await sendEmail(mailObj));

        return ({ code: 0, message: `User account created successfully` });
    }

    ////////////////////////
    // UTILITIES
    ///////////////////////
    fetchAll() {
        return UserModel.find()
            .then(user => user)
            .catch(err => {
                console.log('Error fetching users ->', err);
                return 0;
            });
    }

    cleanUser(user) {
        delete user['pass'];
        delete user['_id'];
        delete user['__v'];

        return user;
    }

    async fetchOne(email) {
        return await UserModel.findOne({ email })
            .then(user => user)
            .catch(err => {
                console.log('Error fetching user ->', err);
                return 0;
            });
    }

    async doesUserExist(email) {
        return await UserModel.exists({ email })
            .then(data => data)
            .catch(err => {
                console.log(err);
                return null;
            });
    }
}

module.exports = UserController;