const mongoose = require('mongoose');


const AdminModel = mongoose.Schema({
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
    email: {
        type: String,
        required: true,
        trim: true,
    },
    pass: {
        type: String,
        required: true,
        trim: true,
    },
    createdAt: Date,
    image: {
        type: String
    },
    logins: {
        type: String,
    }
});

module.exports = mongoose.model('Admin', AdminModel);