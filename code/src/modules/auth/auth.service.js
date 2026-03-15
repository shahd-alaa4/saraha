import { model } from "mongoose";
import { findOne, create, findOneAndUpdate } from "../../DB/database.repository.js";
import { userMadel } from './../../DB/model/user.model.js';
import { badRequestException, conflictException, notfoundException } from './../../common/utils/response/error.response.js';
import { compareHash, generateHash } from "../../common/security/hash.security.js";
import { rsaDecrypt, rsaEncrypt } from "../../common/security/rsa.security.js";
import { createLoginCredentials } from "../../common/security/token.security.js";
import { OAuth2Client } from "google-auth-library";
import { ProviderEname } from "../../common/enums/user.enum.js";
import { createNumberOtp } from "../../common/utils/otp.js";
import { baseRevokeTokenKey, deleteKey, get, increment, keys, otpBlokKey, otpKey, otpMaxRequestKey, revokeTokenKey, set ,ttl} from './../../common/services/redis.service.js';
import { EmailEnum } from './../../common/enums/email.enum.js';
import { sendEmail } from './../../common/utils/email/sendEmail.js';
import { emailTemplate } from './../../common/utils/email/template.email.js';
import { emailEmitter } from './../../common/utils/email/email.event.js';



const sendEmailOtp = async({title,subject,email})=>{
  const blockOtpTTl=await ttl(otpBlokKey(email,subject))
  if (blockOtpTTl>0) {
    throw conflictException({message:`Sorry we cannot request new otp while current otp is blocked ${blockOtpTTl}`})
  }

  const currentOtpTTL=await ttl(otpKey(email,subject))
  if (currentOtpTTL>0) {
    throw conflictException({message:`Sorry we cannot request new otp while current otp is  ${currentOtpTTL}`})
  }


   if (await get(otpMaxRequestKey(email,subject)) >= 3) {
     await set({
       key: otpBlokKey(email,subject),
       value: 1,
       ttl: 300
     })
     throw conflictException({ message: `Sorry we cannot request new otp while current otp is blocked${300}seconds` });
   }

      const code = await createNumberOtp()
   await set({
     key: otpKey(email,subject),
     value: await generateHash({ plaintext: `${code}` }),
     ttl: 120
   })

   await sendEmail({
    to:email,
    subject,
    html:emailTemplate({code,title})
   })

if (!await get(otpMaxRequestKey(email,subject))) {
  await set({
    key:otpMaxRequestKey(email,subject),
    value:1,
    ttl:300
  })
}else{
  await increment(otpMaxRequestKey(email,subject))
}

   emailEmitter.emit(emailEmitter.confirmEmail, {
     to: email,
     subject: emailEmitter.confirmEmail,
     code,
     title: emailEmitter.confirmEmail
   })

   return;

}

export const signup = async (inputs) => {
  const { username, email, password, phone } = inputs;
  const checkUserExist = await findOne({
    model: userMadel,
    filter: { email }
  })
  if (checkUserExist) {
    throw badRequestException({ message: "Email exist" })
  }




  const user = await create({
    model: userMadel,
    data: {
      username,
      email,
      password: await generateHash({ plaintext: password }),
      // phone:await generateEncryption(phone),
      phone: await rsaEncrypt(phone),
    deleteAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  })
await sendEmailOtp({title:"verify_Email",subject:EmailEnum.confirmEmail,email})

  // generateAndSendConfirmEmailOtp(email)

  return user
}

export const confirmEmail = async ({ email, otp }={}) => {


  const account = await findOne({
    model: userMadel,
    filter: {
      email,
      confirmEmail: { $exists: false },
      provider: ProviderEname.System
    }
  });
  if (!account) {
    throw notfoundException({ message: "Fail to find matching account" });
  }

  // const hashOtp = await get(otp(email))
const hashOtp = await get(otpKey(email, EmailEnum.confirmEmail))
  if (!hashOtp) {
    throw notfoundException({ message: "Expired otp" });
  }
  if (!await compareHash({ plaintext: otp, cipherText: hashOtp })) {
    throw conflictException({ message: "Invalid otp" });
  }

  account.confirmEmail = new Date()
  account.deleteAt = undefined
  await account.save()

  await deleteKey(await keys(otpKey(email,EmailEnum.confirmEmail)))

  // await deleteKey(otpKey(email, EmailEnum.confirmEmail))
  return;
};

export const reSendConfirmEmail = async (inputs) => {
  const { email } = inputs;

  const account = await findOne({
    model: userMadel,
    filter: {
      email,
      confirmEmail: { $exists: false },
      provider: ProviderEname.System
    }
  });
  if (!account) {
    throw notfoundException({ message: "Fail to find matching account" });
  }

  // const remainingTime = await ttl(otpKey(email, EmailEnum.confirmEmail))

const remainingTime = await ttl(
  otpKey(email, EmailEnum.confirmEmail)
)

  // const remainingTime = await ttl(otpKey(email))
  if (remainingTime > 0) {
    throw conflictException({ message: `Sorry we cannot provide new otp until one is expired you can try again later after ${remainingTime}` });
  }
await sendEmailOtp({title:"verify_Email",subject:EmailEnum.confirmEmail,email})
  // await generateAndSendConfirmEmailOtp(email)
  return;
};

export const requestForgotPasswordCode = async ({email}) => {

  const account = await findOne({
    model: userMadel,
    filter: {
      email,
      confirmEmail: { $exists: true },
      provider: ProviderEname.System
    }
  });
  if (!account) {
    throw notfoundException({ message: "Fail to find matching account" });
  }

  await sendEmailOtp({title:"Reset Password" , subject: EmailEnum.forgotPassword,email})

  return;
};

export const verifyForgotPasswordCode = async ({email,otp}) => {

   const hashOtp = await get(otpKey(email, EmailEnum.forgotPassword))
  if (!hashOtp) {
    throw notfoundException({ message: "Expired otp" });
  }
  if (!await compareHash({ plaintext: otp, cipherText: hashOtp })) {
    throw conflictException({ message: "Invalid otp" });
  }

  return;
};

export const resetForgotPasswordCode = async ({email,password,otp}) => {

await verifyForgotPasswordCode({email,otp})
 const account = await findOneAndUpdate({
    model: userMadel,
    filter: {email},
    update:{
      password:await generateHash({ plaintext:password}),
      changeCredentialsTime:new Date(Date.now())
    },
    
  options: { new: true }
  });
  if (!account?._id) {
    throw notfoundException({ message: "Fail to reset this account password" });
  }

const otpKeys = await keys(otpKey({email,subject:EmailEnum.forgotPassword}))
const tokenKeys = await keys(baseRevokeTokenKey({ userId: account._id }))
await deleteKey([...otpKeys,...tokenKeys])
  return;
};

const verifyGoogleAccount = async (idToken) => {
  const client = new OAuth2Client();

  const ticket = await client.verifyIdToken({
    idToken,
    audience: "839999590901-e5nnmbbdvsvaf95u1bc9757of6bt0icm.apps.googleusercontent.com",
  });
  const payload = ticket.getPayload();
  if (!payload?.email_verified) {
    throw badRequestException({ message: "fail to verify by google" })
  }
  return payload
}

export const loginWithGmail = async (idToken, issuer) => {



  const payload = await verifyGoogleAccount(idToken)
  console.log(payload);

  const user = await findOne({
    model: userMadel,
    filter: { email: payload.email, provider: ProviderEname.Google }
  })
  if (user) {
    throw notfoundException({ message: "Not registered account" })
  }


  return await createLoginCredentials(user, issuer)

}

export const signupWithGmail = async (idToken, issuer) => {



  const payload = await verifyGoogleAccount(idToken)
  console.log(payload);

  const checkExist = await findOne({
    model: userMadel,
    filter: { email: payload.email }
  })
  if (checkExist) {
    if (checkExist.provider != ProviderEname.Google) {
      throw conflictException({ message: "Invalid Login provider" })
    }
    return { status: 200, credentials: await loginWithGmail(idToken, issuer) }

  }

  const user = await create({
    model: userMadel,
    data: {
      firstName: payload.given_name,
      lastName: payload.family_name,
      email: payload.email,
      profilePicture: payload.picture,
      confirmEmail: new Date(),
      provider: ProviderEname.Google,
    }
  })
  return { status: 201, credentials: await createLoginCredentials(user, issuer) }

}

export const login = async (inputs, issuer) => {
  const { email, password } = inputs;
  const user = await findOne({
    model: userMadel,
    filter: { email, provider: ProviderEname.System, confirmEmail: { $exists: true } },
    // select: "-password"

  })

  if (!user) {
    throw badRequestException({ message: "Invalid login credentials " })
  }

const failKey = `login_fail:${email}`

const attempts = await increment(failKey)

if(attempts == 1){
 await set({
   key: failKey,
   value: 1,
   ttl: 300
 })
}

if(attempts >= 5){
 throw conflictException({message:"Account blocked for 5 minutes"})
}


  if (! await compareHash({ plaintext: password, cipherText: user.password })) {
    throw notfoundException({ message: "Invalid login credentials" });
  }
  // user.phone = await generatDecryption(user.phone)
  user.phone = await rsaDecrypt(user.phone)
  return await createLoginCredentials(user, issuer)
}