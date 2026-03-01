import  joi from "joi"

export const login = joi.object().keys({
    email:joi.string().email({minDomainSegments:2 , maxDomainSegments:3,tlds:{allow:['com','net']}}).required(),
    password: joi.string().pattern(new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).{8,16}$/)).required()
}).required()

export const signup = login.append().keys({
    username:joi.string().pattern(new RegExp(/^[A-Z]{1}[a-z]{1,24}\s[A-Z]{1}[a-z]{1,24}$/)).required().messages({
        "any.required":"username is required",
        "string.empty":"username cannot be empty",
    }),
    phone: joi.string().pattern(new RegExp(/^(00201|\+201|01)(0|1|2|5)\d{8}/)).required(),
    confirmPassword: joi.string().valid(joi.ref("password")).required(),
}).required()