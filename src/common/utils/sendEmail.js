import nodemailer from "nodemailer";
import { EMAIL_USER, EMAIL_PASS } from "../../../config/config.service.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

transporter.verify((err, success) => {
  if (err) {
    console.log("Email server error:", err);
  } else {
    console.log("Email server ready to send messages!");
  }
});

export const sendOtpEmail = async (email, otp) => {
  await transporter.sendMail({
    from: EMAIL_USER,
    to: email,
    subject: "Saraha Email Verification",
    text: `Your OTP code is: ${otp}`
  });
};
