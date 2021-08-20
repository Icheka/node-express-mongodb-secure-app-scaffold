const joi = require('joi');

const newUserSchema = joi.object({
    firstname: joi.string().required().trim().min(2).required(),
    middlename: joi.string().allow('').trim().optional(),
    lastname: joi.string().required().trim().min(2).required(),
    email: joi.string().required().trim().email().required(),
    password: joi.string().required().trim().min(6).required(),
});

const existingUserSchema = joi.object({
    email: joi.string().required().trim().email().required(),
    password: joi.string().required().trim().min(6).required(),
});

const updateProfileImageSchema = joi.object({
    email: joi.string().required().trim().email().required(),
    image: joi.string().required().trim().uri()
});

const newUserWithGoogleSchema = joi.object({
    firstname: joi.string().required().trim().min(2).required(),
    middlename: joi.string().allow('').trim().optional(),
    lastname: joi.string().required().trim().min(2).required(),
    email: joi.string().required().trim().email().required(),
    googleId: joi.string().required().trim().min(6).required(),
    image: joi.string().required().trim().min(6).required(),
});

const newUserWithFacebookSchema = joi.object({
    firstname: joi.string().required().trim().min(2).required(),
    middlename: joi.string().allow('').trim().optional(),
    lastname: joi.string().required().trim().min(2).required(),
    email: joi.string().required().trim().email().required(),
    googleId: joi.string().required().trim().min(6).required(),
    image: joi.string().required().trim().min(6).required(),
});

const kycObjectSchema = joi.object({
    firstname: joi.string().required().trim().min(2).required(),
    lastname: joi.string().required().trim().min(2).required(),
    address: joi.string().required().trim().min(2).required(),
    city: joi.string().required().trim().min(1).required(),
    countryOfResidence: joi.string().required().trim().min(2).required(),
    dob: joi.string().required().trim().min(6).required(),
    nationality: joi.string().required().trim().min(2).required(),
    zip: joi.string().required().trim().min(4).required(),
    phone: joi.string().required().trim().min(7).required(),
    documents: joi.array().required().length(2),
    selfie: joi.string().required().trim().min(2).required(),
    email: joi.string().required().trim().email().required(),
});



module.exports = {
    newUserSchema,
    existingUserSchema,
    updateProfileImageSchema,
    newUserWithGoogleSchema,
    kycObjectSchema
}