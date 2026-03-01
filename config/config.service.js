import { resolve } from 'node:path'
import { config } from 'dotenv'

export const NODE_ENV = process.env.NODE_ENV

const envPath = {
    development: `.env.development`,
    production: `.env.production`,
}
console.log({ en: envPath[NODE_ENV] });


config({ path: resolve(`./config/${envPath[NODE_ENV]}`) })


export const port = process.env.PORT ?? 7000

export const DB_URI = process.env.DB_URI

export const EMAIL_USER = process.env.EMAIL_USER
export const EMAIL_PASS = process.env.EMAIL_PASS


console.log("EMAIL_USER:", EMAIL_USER);
console.log("EMAIL_PASS:", EMAIL_PASS);

export const SALT_ROUND = parseInt(process.env.SALT_ROUND ?? '10')
console.log({ SALT_ROUND });
export const IV_LENGTH = parseInt(process.env.IV_LENGTH ?? '16')
export const ENC_SECRET_KEY = Buffer.from(process.env.ENC_SECRET_KEY)

export const RSA_PUBLIC_KEY = process.env.RSA_PUBLIC_KEY?.replace(/\\n/g, '\n')
export const RSA_PRIVATE_KEY = process.env.RSA_PRIVATE_KEY?.replace(/\\n/g, '\n')

export const SYSTEM_TOKEN_SECRET_KEY = process.env.SYSTEM_TOKEN_SECRET_KEY
export const USER_TOKEN_SECRET_KEY = process.env.USER_TOKEN_SECRET_KEY
export const SYSTEM_REFRESH_TOKEN_SECRET_KEY = process.env.SYSTEM_REFRESH_TOKEN_SECRET_KEY
export const USER_REFRESH_TOKEN_SECRET_KEY = process.env.USER_REFRESH_TOKEN_SECRET_KEY
export const ACCESS_EXPIRES_IN = parseInt(process.env.ACCESS_EXPIRES_IN )
export const REFRESH_EXPIRES_IN = parseInt(process.env.REFRESH_EXPIRES_IN )

export const UPLOAD_PATH = process.env.UPLOAD_PATH || "uploads"
export const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || 2097152)