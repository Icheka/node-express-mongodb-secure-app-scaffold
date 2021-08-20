const mongoose = require('mongoose');


const UserModel = mongoose.Schema({
    firstname: {
        type: String,
        required: true,
        trim: true,
    },
    lastname: {
        type: String,
        required: true,
        trim: true,
    },
    middlename: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
    },
    pass: {
        type: String,
        trim: true,
    },
    createdAt: Date,
    image: {
        type: String
    },
    logins: {
        type: String,
    },
    googleId: {
        type: String,
    },
    facebookId: {
        type: String,
    },
    isEmailVerified: Boolean,
    signupMethod: String,
    expires: Date,
    isAccountVerified: Boolean,

    address: String,
    city: String,
    countryOfResidence: String,
    dob: String,
    nationality: String,
    zip: String,
    phone: String,
    selfie: String,
    documents: String,
    kycStatus: String,
}, {
    timestamps: true
});

module.exports = mongoose.model('User', UserModel);