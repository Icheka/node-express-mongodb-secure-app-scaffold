const joi = require('joi');


const newAdminSchema = joi.object({
    firstname: joi.string().required().trim().min(2).required(),
    middlename: joi.string().allow('').trim().optional(),
    lastname: joi.string().required().trim().min(2).required(),
    email: joi.string().required().trim().email().required(),
    password: joi.string().required().trim().min(6).required(),
});

const existingAdminModel = joi.object({
    email: joi.string().required().trim().email().required(),
    password: joi.string().required().trim().min(6).required(),
});


module.exports = {
    newAdminSchema,
    existingAdminModel
}