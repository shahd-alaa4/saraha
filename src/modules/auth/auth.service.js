import { model } from "mongoose";
import { findOne, create, updateOne, findOneAndUpdate } from "../../DB/database.repository.js";
import { userMadel } from './../../DB/model/user.model.js';
import { badRequestException, conflictException, notfoundException } from './../../common/utils/response/error.response.js';
import { compareHash, generateHash } from "../../common/security/hash.security.js";
import { generateOtp } from "../../common/utils/generateOtp.js";
import { sendOtpEmail } from "../../common/utils/sendEmail.js";
import { rsaDecrypt, rsaEncrypt } from "../../common/security/rsa.security.js";
import { createLoginCredentials } from "../../common/security/token.security.js";
import {OAuth2Client} from "google-auth-library";
import { ProviderEname } from "../../common/enums/user.enum.js";




export const signup = async (inputs) => {
    const { userName, email, password, phone } = inputs;
    const checkUserExist = await findOne({
        model: userMadel,
        filter: { email }
    })
    if (checkUserExist) {
        throw badRequestException({ message: "Email exist" })
    }


  const otp = generateOtp();
  const otpExpire = new Date(Date.now() +  5 * 60 * 1000);

    const user = await create({
        model: userMadel,
        data: {
            userName,
            email,
            password:await generateHash({plaintext:password}),
            // phone:await generateEncryption(phone),
            phone: await rsaEncrypt(phone),
             otp,
      otpExpire,
      isConfirmed: false
        }
    })

 
  await sendOtpEmail(email, otp);



    return user
}




export const verifyOtp = async ({ email, otp: inputOtp }) => {

  const user = await findOne({ model: userMadel, filter: { email } });
  if (!user){
   throw  badRequestException({ message: "User not found" });
  } 

  
  if (user.otp !== inputOtp){
throw badRequestException({ message: "Invalid OTP" });
  } 

  if (user.otpExpire < new Date()){
    throw badRequestException({ message: "OTP expired" });
  } 

  const updatedUser = await findOneAndUpdate({
    model: userMadel,
    filter: { email },
    update: {
      isConfirmed: true,
      otp: null,
      otpExpire: null
    },
    options: { new: true } 
  });

  return updatedUser
};




export const login = async (inputs,issuer) => {
    const { email, password } = inputs;
    const user = await findOne({
        model: userMadel,
        filter: { email ,provider:ProviderEname.System},
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
    return await createLoginCredentials(user,issuer)
}

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




const verifyGoogleAccount = async(idToken) =>{
    const client = new OAuth2Client();

      const ticket = await client.verifyIdToken({
      idToken,
      audience:"839999590901-e5nnmbbdvsvaf95u1bc9757of6bt0icm.apps.googleusercontent.com",  
  });
  const payload = ticket.getPayload();
  if(!payload?.email_verified){
    throw badRequestException({message:"fail to verify by google"})
  }
  return payload
}

export const loginWithGmail = async (idToken,issuer) => {



 const payload = await verifyGoogleAccount(idToken)
 console.log(payload);
 
 const user = await findOne({
    model:userMadel,
filter:{email:payload.email,provider:ProviderEname.Google}
 })
 if (user) {
   throw notfoundException({message:"Not registered account"})
 }


 return await createLoginCredentials(user,issuer)

}



export const signupWithGmail = async (idToken,issuer) => {



 const payload = await verifyGoogleAccount(idToken)
 console.log(payload);
 
 const checkExist = await findOne({
    model:userMadel,
filter:{email:payload.email}
 })
 if (checkExist) {
    if (checkExist.provider!=ProviderEname.Google) {
        throw conflictException({message:"Invalid Login provider"})
    }
    return {status:200,credentials:await loginWithGmail(idToken,issuer)}

 }

 const user = await create({
    model : userMadel,
    data:{
        firstName : payload.given_name,
        lastName : payload.family_name,
        email : payload.email,
        profilePicture : payload.picture,
        confirmEmail : new Date(),
        provider : ProviderEname.Google,
    }
 })
 return{status:201,credentials:await createLoginCredentials(user,issuer)}

}