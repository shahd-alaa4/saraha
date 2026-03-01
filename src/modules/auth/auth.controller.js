import { Router } from 'express'
import {   login, signup, signupWithGmail, verifyOtp } from './auth.service.js';
import { successResponse } from './../../common/utils/response/success.response.js';
import * as validators from"./auth.validation.js"
import { validation } from '../../middleware/validation.middleware.js';

const router = Router(); 

router.post("/signup",validation(validators.signup) ,async (req, res, next) => {
    const result = await signup(req.body)
    return successResponse({res , data:{result}})
})


router.post("/verify-otp",validation(validators.login), async (req, res, next) => {
  const { email, otp } = req.body;
  const result = await verifyOtp({ email, otp });
  return successResponse({ res, data: { result }});
});



router.post("/login", async (req, res, next) => {
    const result = await login(req.body,`${req.protocol}://${req.host}`)
    return successResponse({res , data:{result}})
})


router.post("/signup/gmail", async (req, res, next) => {
    
    const {status,credentials} = await signupWithGmail(req.body.idToken,`${req.protocol}://${req.host}`)
    return successResponse({res ,status, data:{...credentials}})
})


export default router