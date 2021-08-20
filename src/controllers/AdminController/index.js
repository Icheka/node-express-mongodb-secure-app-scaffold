const crypt = require('../../helpers/crypt');
const UserModel = require('../../models/UserModel');
const UserController = require('../UserController');
const userController = new UserController();
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { setTokenCookie } = require('../../helpers/cookies');
const { newAdminSchema, existingAdminModel } = require('./joiSchemas');
const AdminModel = require('../../models/AdminModel');


class AdminController {
    async changePassword(id, oldPassword, newPassword) {

        return await AdminModel.findOne({ _id: id })
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

    async whomai(id) {
        const me = await AdminModel.findOne({ _id: id })
            .then(data => data)
            .catch(err => {
                console.log(err);
                return null;
            });

        if (!me) return { code: 1, message: `An error occurred` };
        return { code: 0, message: me };
    }

    async updateUser(user) {
        delete user.logins;
        delete user.__v;
        delete user.pass;

        const u = await UserModel.findOne({ _id: user._id })
            .then(data => data)
            .catch(err => {
                console.log(err);
                return 0;
            });

        if (u === null) return { code: 1, message: `No user found` };
        if (user === 0) return { code: 2, message: `An error occurred on the server` };

        Object.keys(user).forEach(o => u[o] = user[o]);
        u.save();

        console.log('Updated user');

        return { code: 0, message: `Records updated successfully` };
    }

    async deleteUsers(users) {
        if (!Array.isArray(users)) return { code: 1, message: `Request data must be an array` };

        const d = await UserModel.deleteMany({ _id: users })
            .then(data => data)
            .catch(err => {
                console.log(err);
                return null;
            });

        console.log(d);
        if (!d) return { code: 1, message: `An error occurred on the server` };

        return { code: 0, message: `Deleted ${d.deletedCount} records` };
    }

    async getAllDeposits() {
        const d = await DepositModel.find()
            .then(data => data)
            .catch(err => {
                console.log(err);
                return null;
            });
        if (!d) return { code: 1, message: `An error occurred on the server` };
        return { code: 0, message: d };
    }

    async getAllWithdrawals() {
        const d = await WithdrawalModel.find()
            .then(data => data)
            .catch(err => {
                console.log(err);
                return null;
            });
        if (!d) return { code: 1, message: `An error occurred on the server` };
        return { code: 0, message: d };
    }

    async approveDeposits(depositIds) {
        if (!Array.isArray(depositIds)) return { code: 1, message: `Request data must be an array` };

        const deposits = await depositController.find(depositIds);
        if (!deposits) return { code: 2, message: `An error occurred on the server` };

        deposits.forEach(d => {
            d.status = 'active';
            d.save();
        });
        return { code: 0, message: `Records updated successfully` };
    }

    async approveWithdrawals(withdrawalIds) {
        if (!Array.isArray(withdrawalIds)) return { code: 1, message: `Request data must be an array` };

        const withdrawals = await withdrawalController.find(withdrawalIds);
        if (!withdrawals) return { code: 2, message: `An error occurred on the server` };

        withdrawals.forEach(d => {
            d.status = 'paid';
            d.save();
        });
        return { code: 0, message: `Records updated successfully` };
    }

    async getAllUsers() {
        const users = await userController.fetchAll();

        console.log(`Fetched all users`);

        return users == 0
            ?
            { code: 1, message: `An error occurred on the server` }
            :
            { code: 0, message: users }
    }

    async login(user, req, res) {
        // is user object valid?
        const v = existingAdminModel.validate(user);
        if (v.error) return { code: 1, message: v.error };

        // does user exist?
        const possibleUser = await this.fetchOne(user.email);
        if (!possibleUser) return { code: 2, message: `The email or password is incorrect` };

        // since user exists, do passwords match?
        const p = await crypt.compare(user.password, possibleUser.pass);
        if (!p) return { code: 2, message: `The email or password is incorrect` };

        // since passwords match, create tokens and push back
        const accessToken = jwt.sign({
            id: possibleUser._id, email: possibleUser.email, role: `admin`
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

    async createAdmin(user) {
        // is user object valid?
        const v = newAdminSchema.validate(user);
        if (v.error) return { code: 1, message: v.error };

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
        user.profits = 0;

        user = new AdminModel(user);
        user.save();

        return ({ code: 0, message: `User account created successfully` });
    }

    ////////////////////////
    // UTILITIES
    ///////////////////////
    async doesUserExist(email) {
        return await AdminModel.exists({ email })
            .then(data => data)
            .catch(err => {
                console.log(err);
                return null;
            });
    }

    async fetchOne(email) {
        return await AdminModel.findOne({ email })
            .then(user => user)
            .catch(err => {
                console.log('Error fetching admin ->', err);
                return 0;
            });
    }
}


module.exports = AdminController;