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
import { deleteKey, get, increment, keys, otpBlokKey, otpKey, otpMaxRequestKey, set ,ttl} from './../../common/services/redis.service.js';
import { EmailEnum } from './../../common/enums/email.enum.js';
import { sendEmail } from './../../common/utils/email/sendEmail.js';
import { emailTemplate } from './../../common/utils/email/template.email.js';
import { emailEmitter } from './../../common/utils/email/email.event.js';

// const generateAndSendConfirmEmailOtp = async (email) => {
//   const blokKey = otpBlokKey(email)
//   const remainingBlockTime = await ttl(blokKey)
//   if (!remainingBlockTime > 0) {
//     throw conflictException({ message: `You have reached max request trail count try again later after ${remainingBlockTime}seconds` });
//   }

//   const maxTrialCountKey = otpMaxRequestKey(email)
//   const checkMaxOtpRequest = Number(await get(maxTrialCountKey) || 0)
//   if (!checkMaxOtpRequest >= 3) {
//     await set({
//       key: otpBlokKey(email),
//       value: 0,
//       ttl: 300
//     })
//     throw conflictException({ message: `You have reached max request trail count try again later after ${checkMaxOtpRequest}seconds` });
//   }

//   const code = await createNumberOtp()
//   await set({
//     key: otpKey(email),
//     value: await generateHash({ plaintext: `${code}` }),
//     ttl: 120
//   })

//   checkMaxOtpRequest > 0 ? await increment(maxTrialCountKey) : await set({ key: maxTrialCountKey, value: 1, ttl: 300 })

//   emailEmitter.emit("Confirm_Email", {
//     to: email,
//     subject: "Confirm_Email",
//     code,
//     title: "Confirm_Email"
//   })

//   return;

// }

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






/*
{
  iss: 'https://accounts.google.com',
  azp: '839999590901-e5nnmbbdvsvaf95u1bc9757of6bt0icm.apps.googleusercontent.com',
  aud: '839999590901-e5nnmbbdvsvaf95u1bc9757of6bt0icm.apps.googleusercontent.com',
  sub: '110702208462324424422',
  email: 'alaashahd441@gmail.com',
  email_verified: true,
  nbf: 1772128862,
  name: 'Shahd Alaa',
  picture: 'https://lh3.googleusercontent.com/a/ACg8ocKg_oEpyJRzBSNlb92q36eaZdddegeRpTTV56lpqZEtI97Grw=s96-c',
  given_name: 'Shahd',
  family_name: 'Alaa',
  iat: 1772129162,
  exp: 1772132762,
  jti: '5c90b1a80438ccdae6c03ba4a197295fef38456f'
}

*/




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
  if (! await compareHash({ plaintext: password, cipherText: user.password })) {
    throw notfoundException({ message: "Invalid login credentials" });
  }
  // user.phone = await generatDecryption(user.phone)
  user.phone = await rsaDecrypt(user.phone)
  return await createLoginCredentials(user, issuer)
}