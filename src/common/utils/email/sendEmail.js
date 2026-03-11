import nodemailer from "nodemailer";
import { EMAIL_USER, EMAIL_PASS, APPLICATION_NAME } from "../../../../config/config.service.js";


export const sendEmail = async ({
  to, cc, bcc, subject, html, attachments = []
} = {}) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    }
  });

  const info = await transporter.sendMail({
    to,
    cc,
    bcc,
    subject,
    html,
    attachments,

    from: `"${APPLICATION_NAME}"<${EMAIL_USER}>`,

  });
  console.log("Message sent:", info.messageId);

}
