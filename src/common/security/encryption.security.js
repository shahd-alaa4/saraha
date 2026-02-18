import crypto from 'node:crypto'
import { ENC_SECRET_KEY, IV_LENGTH } from '../../../config/config.service.js'

export const generateEncryption = async (plaintext)=>{
// console.log(crypto.randomBytes(IV_LENGTH).toString('hex'));
const iv = crypto.randomBytes(IV_LENGTH)
const cipherIV = crypto.createCipheriv('aes-256-cbc',ENC_SECRET_KEY,iv)
let cipherText = cipherIV.update(plaintext,'utf-8','hex')
cipherText += cipherIV.final('hex')
console.log({iv,ivt:iv.toString('hex'),cipherIV,cipherText});
return `${iv.toString('hex')}:${cipherText}`
}

export const generatDecryption = async (cipherText)=>{

const [iv , encryptedData]= cipherText.split(":" || []);

const ivLIKEBainary = Buffer.from(iv , 'hex')
let deCipherIV = crypto.createDecipheriv('aes-256-cbc',ENC_SECRET_KEY,ivLIKEBainary)
let plaintext=deCipherIV.update(encryptedData,'hex','utf-8')
plaintext += deCipherIV.final('utf-8')
console.log({iv,encryptedData,ivLIKEBainary,deCipherIV,plaintext});
return plaintext
}