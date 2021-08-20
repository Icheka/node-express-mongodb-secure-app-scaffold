const mongoose = require('mongoose');


const EmailVerificationModel = mongoose.Schema({
    link: {
        type: String,
        required: true,
        trim: true,
    },
    isUsed: Boolean,
}, {
    timestamps: true
});


module.exports = mongoose.model('EmailVerification', EmailVerificationModel);