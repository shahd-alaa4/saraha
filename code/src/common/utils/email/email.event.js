import { EventEmitter } from 'node:events';
import { sendEmail } from './sendEmail.js';
import { emailTemplate } from './template.email.js';

export const emailEmitter = new EventEmitter()

// emailEmitter.on("Confirm_Email", async ({ to, subject = "Verify_Account", title = "Confirm_Email" } = {}) => {
//     try {
//         await sendEmail({
//             to,
//             subject,
//             html: emailTemplate({ code, title })
//         })
//     } catch (error) {
//         console.log(`Fail to send user email ${error}`);

//     }
// })

emailEmitter.on("sendEmail", async (fn) => {
    try {
       await fn()
    } catch (error) {
        console.log(`Fail to send user email ${error}`);

    }
})
