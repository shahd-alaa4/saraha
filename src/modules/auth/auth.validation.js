import joi from "joi"
import { generalValidatiotionFields } from './../../common/utils/validation.js';

export const login = {
    body: joi.object().keys({
        email: generalValidatiotionFields.email.required(),
        password: generalValidatiotionFields.password.required()
    }).required()
}

export const signup = {
    body: login.body.append().keys({
        username: generalValidatiotionFields.username.required(),
        phone: generalValidatiotionFields.phone.required(),
        confirmPassword: generalValidatiotionFields.confirmPassword("password").required(),
    }).required()
}
export const reSendConfirmEmail = {
    body: joi.object().keys({
        email: generalValidatiotionFields.email.required(),
    }).required()
}

export const confirmEmail = {
    body:reSendConfirmEmail.body.append({
        otp: generalValidatiotionFields.otp.required()
    }).required()
}

