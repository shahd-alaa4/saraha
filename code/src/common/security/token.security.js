import jwt from 'jsonwebtoken';
import { ACCESS_EXPIRES_IN, REFRESH_EXPIRES_IN, SYSTEM_REFRESH_TOKEN_SECRET_KEY, SYSTEM_TOKEN_SECRET_KEY, USER_REFRESH_TOKEN_SECRET_KEY, USER_TOKEN_SECRET_KEY } from '../../../config/config.service.js';
import { RoleEname } from '../enums/user.enum.js';
import { AudienceEname, TokenTypeEname } from '../enums/security.enum.js';
import { findOne, userMadel } from '../../DB/index.js';
import { badRequestException, notfoundException, unauthorizedException } from '../utils/response/error.response.js';
import { model } from 'mongoose';
import { randomUUID } from 'node:crypto';
import { tokenModel } from '../../DB/model/token.model.js';
import { get, revokeTokenKey } from '../services/redis.service.js';


export const generateToken = async ({
    payload = {},
    secret = USER_TOKEN_SECRET_KEY,
    Option = {}
} = {}) => {
    return jwt.sign(payload, secret, Option)
}
export const verifyToken = async ({
    token,
    secret = USER_TOKEN_SECRET_KEY,

} = {}) => {
    return jwt.verify(token, secret)
}

export const getTokenSignature = async (role) => {
    let accessSignature = undefined;
    let refreshSignature = undefined;
    let audience = AudienceEname.User
    switch (role) {
        case RoleEname.Admin:
            accessSignature = SYSTEM_TOKEN_SECRET_KEY
            refreshSignature = SYSTEM_REFRESH_TOKEN_SECRET_KEY
            audience = AudienceEname.System
            break;

        default:
            accessSignature = USER_TOKEN_SECRET_KEY
            refreshSignature = USER_REFRESH_TOKEN_SECRET_KEY
            audience = AudienceEname.User

            break;
    }
    return { accessSignature, refreshSignature, audience }
}
export const getSignatureLevel = async (audienceType) => {
    let signatureLevel;

    switch (audienceType) {
        case AudienceEname.System:
            signatureLevel = RoleEname.Admin
            break;

        default:
            signatureLevel = RoleEname.User

            break;
    }
    return signatureLevel
}

export const createLoginCredentials = async (user, issuer) => {
    const { accessSignature, refreshSignature, audience } = await getTokenSignature(user.role)

    const jwtid = randomUUID()
    const access_token = await generateToken({
        payload: { sub: user._id },
        secret: accessSignature,
        Option: {
            issuer,
            audience: [TokenTypeEname.access, audience],
            expiresIn: ACCESS_EXPIRES_IN,
            jwtid
        },

    })

    const refresh_token = await generateToken({
        payload: { sub: user._id },
        secret: refreshSignature,
        Option: {
            issuer,
            audience: [TokenTypeEname.refresh, audience],
            expiresIn: REFRESH_EXPIRES_IN,
            jwtid
        },

    })
    return { user, access_token, refresh_token }
}

export const decodeToken = async ({ token, tokenType = TokenTypeEname.access } = {}) => {
    const decoded = jwt.decode(token)

    // console.log({ decoded });
    if (!decoded?.aud?.length) {
        throw badRequestException({ message: "fail to decode this token" })
    }
    const [decodeTokenType, audienceType] = decoded.aud;
    if (decodeTokenType !== tokenType) {
        throw badRequestException({ message: "Invalid token type" })
    }

    if (decoded.jti && await get(revokeTokenKey({
        userId: decoded.sub,
        jti: decoded.jti
    }))) {
        throw unauthorizedException({ message: "Invalid login session" })
    }

    const signatureLevel = await getSignatureLevel(audienceType)
    const { accessSignature, refreshSignature } = await getTokenSignature(signatureLevel)
    // console.log({ accessSignature, refreshSignature });

    const verifedData = await verifyToken({
        token,
        secret: tokenType == TokenTypeEname.refresh ? refreshSignature : accessSignature
    })

    if (!verifedData?.sub) {
        throw badRequestException({ message: "Invalid token payload" })
    }
    // console.log({ verifedData });
    const user = await findOne({
        model: userMadel,
        filter: {
            _id: verifedData.sub
        }
    })

    // console.log("user id from token:", verifedData.sub)

    if (!user) {
        throw notfoundException({ message: "Not Register account" })

    }
    // console.log(changeCredentialsTime: user.changeCredentialsTime?.getTime(), iat: decoded.iat * 1000);

    if (user.changeCredentialsTime && user.changeCredentialsTime?.getTime() >= decoded.iat * 1000) {
        throw unauthorizedException({ message: "Not Register account" })


    }

        // console.log({ decoded, verifedData })

    return { user, decoded }

}