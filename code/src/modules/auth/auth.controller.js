import { Router } from 'express'
import { confirmEmail, login, requestForgotPasswordCode, reSendConfirmEmail, resetForgotPasswordCode, signup, signupWithGmail, verifyForgotPasswordCode } from './auth.service.js';
import { successResponse } from './../../common/utils/response/success.response.js';
import * as validators from "./auth.validation.js"
import { validation } from '../../middleware/validation.middleware.js';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { redisClient } from '../../DB/redis.conection.js';
import geoip from "geoip-lite"

const router = Router();

const loginLimiter = rateLimit({
  windowMs:2*60*1000,
  limit:async function (req) {
    const{country}=geoip.lookup(req.ip)
    return country == "EG" ? 5 : 0
  },
  legacyHeaders:true,
  standardHeaders:"draft-8",
  requestPropertyName:"rateLimit",
  handler:(req,res,next)=>{
    return res.status(429).json({message:"Too many requests"})
  },
  keyGenerator:(req,res,next)=>{
    const ip = ipKeyGenerator(req.ip,56)
    return `${ip}-${req.path}`
  },
  store:{
    async incr(key,cb){
      try {
        const count = await redisClient.incr(key)
        if (count === 1)  await redisClient.expire(key,60)
          cb(null,count)
        
      } catch (err) {
        cb(err)
      }
    },
    async decrement(key){
      if (await redisClient.exists(key)) {
        await redisClient.decr(key)
      }
    }
  }
})


router.post("/signup", validation(validators.signup), async (req, res, next) => {
  const result = await signup(req.body)
  return successResponse({ res, data: { result } })
})


router.patch("/confirm-email", validation(validators.confirmEmail), async (req, res, next) => {
  const result = await confirmEmail(req.body);
  return successResponse({ res, data: { result } });
}); 

router.patch("/resend-confirm-email", validation(validators.reSendConfirmEmail), async (req, res, next) => {
  const result = await reSendConfirmEmail(req.body);
  return successResponse({ res, data: { result } });
}); 

router.post("/request-forgot-password-code", validation(validators.reSendConfirmEmail), async (req, res, next) => {
    await requestForgotPasswordCode(req.body);
  return successResponse({ res,status:201});
});

router.patch("/verify-forgot-password-code", validation(validators.confirmEmail), async (req, res, next) => {
    await verifyForgotPasswordCode(req.body);
  return successResponse({ res,status:200});
});

router.patch("/reset-forgot-password-code", validation(validators.resetPassword), async (req, res, next) => {
    await resetForgotPasswordCode(req.body);
  return successResponse({ res,status:200});
});



router.post("/login",loginLimiter, async (req, res, next) => {
  const credentials  = await login(req.body, `${req.protocol}://${req.host}`)
  return successResponse({ res, data: { ...credentials  } })
})


router.post("/signup/gmail", async (req, res, next) => {

  const { status, credentials } = await signupWithGmail(req.body.idToken, `${req.protocol}://${req.host}`)
  return successResponse({ res, status, data: { ...credentials } })
})


export default router