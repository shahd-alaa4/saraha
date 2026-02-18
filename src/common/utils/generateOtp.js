// export const generateOtp = (length = 6) => {
//   return Math.floor(Math.random() * Math.pow(10, length))
//     .toString()
    
// };


import otpGenerator from "otp-generator";

export const generateOtp = (length = 6) => {
  return otpGenerator.generate(length, {
    digits: true,
    upperCaseAlphabets: false,
    specialChars: false
  });
};