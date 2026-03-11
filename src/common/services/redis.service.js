import { redisClient } from "../../DB/redis.conection.js";
import { EmailEnum } from "../enums/email.enum.js";

export const baseRevokeTokenKey = ({ userId }) => {
    return `RevokeToken::${userId}`
}

export const revokeTokenKey = ({ userId, jti }) => {
    return `RevokeToken::${userId}::${jti}`
}
export const otpKey = (email,subject = EmailEnum.confirmEmail) => {
    return `OTP::User::${email}::${subject}`
}

export const otpMaxRequestKey = (email,subject = EmailEnum.confirmEmail) => {
    return `${otpKey(email,subject)}::Request`
}

export const otpBlokKey = (email,subject = EmailEnum.confirmEmail) => {
    return `${otpKey(email,subject)}::Block`
}


export const set = async ({
    key,
    value,
    ttl
} = {}) => {
    try {
        let data = typeof value === 'string' ? value : JSON.stringify(value)
        return ttl ? await redisClient.set(key, data, { EX: ttl }) : await redisClient.set(key, data)
    } catch (error) {
        console.log(`Fail in set operation ${error}`);

    }
}


export const update = async ({
    key,
    value,
    ttl
} = {}) => {
    try {
        if (!await redisClient.exists(key)) {
            return 0
        }
        return await set({ key, value, ttl })

    } catch (error) {
        console.log(`Fail in update operation ${error}`);

    }
}
export const increment = async (key) => {
    try {
        if (!await redisClient.exists(key)) {
            return 0
        }
        return redisClient.incr(key)

    } catch (error) {
        console.log(`Fail in increment operation ${error}`);

    }
}

export const get = async (key) => {
    try {
        try {
            return JSON.parse(await redisClient.get(key))
        } catch (error) {
            return await redisClient.get(key)
        }

    } catch (error) {
        console.log(`Fail in get operation ${error}`);

    }
}

export const exists = async (key) => {
    try {

        return await redisClient.exists(key)

    } catch (error) {
        console.log(`Fail in exists operation ${error}`);

    }
}

export const expire = async (key) => {
    try {

        return await redisClient.expire(key)

    } catch (error) {
        console.log(`Fail in expire operation ${error}`);

    }
}

export const mGet = async (keys = []) => {
    try {
        if (!keys.length) {
            return 0
        }
        return await redisClient.mGet(keys)

    } catch (error) {
        console.log(`Fail in mget operation ${error}`);

    }
}

export const keys = async (prefix) => {
    try {

        return await redisClient.keys(`${prefix}`)

    } catch (error) {
        console.log(`Fail in keys operation ${error}`);

    }
}

export const ttl = async (key) => {
    try {

        return await redisClient.ttl(key)

    } catch (error) {
        console.log(`Fail in ttl operation ${error}`);

    }
}

export const deleteKey = async (key) => {
    try {
      
        return await redisClient.del(key)

    } catch (error) {
        console.log(`Fail in dell operation ${error}`);

    }
}


