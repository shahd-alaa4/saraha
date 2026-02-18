import { model } from "mongoose";
import { findOne, create, updateOne } from "../../DB/database.repository.js";
import { userMadel } from './../../DB/model/user.model.js';
import { notfoundException } from './../../common/utils/response/error.response.js';
import { compareHash, generateHash } from "../../common/security/hash.security.js";
import { generateOtp } from "../../common/utils/generateOtp.js";
import { sendOtpEmail } from "../../common/utils/sendEmail.js";
import { rsaDecrypt, rsaEncrypt } from "../../common/security/rsa.security.js";
import { createLoginCredentials } from "../../common/security/token.security.js";





export const signup = async (inputs) => {
    const { userName, email, password, phone } = inputs;
    const checkUserExist = await findOne({
        model: userMadel,
        filter: { email }
    })
    if (checkUserExist) {
        throw notfoundException({ message: "Email exist" })
    }


  const otp = generateOtp();
  const otpExpire = new Date(Date.now() + 10 * 60 * 1000);

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






export const login = async (inputs,issuer) => {
    const { email, password } = inputs;
    const user = await findOne({
        model: userMadel,
        filter: { email },
        // select: "-password"

    })

    if (!user) {
        throw notfoundException({ message: "Invalid login credentials " })
    }
    if (! await compareHash({ plaintext: password, cipherText: user.password })) {
     throw notfoundException({ message: "Invalid login credentials" });
    }
    // user.phone = await generatDecryption(user.phone)
    user.phone = await rsaDecrypt(user.phone)

 

    return await createLoginCredentials(user,issuer)
}
