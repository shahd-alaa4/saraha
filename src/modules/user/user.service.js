import jwt from 'jsonwebtoken';
import { create, deleteMany, findById, findOne } from './../../DB/database.repository.js';
import { userMadel } from '../../DB/index.js';
import { createLoginCredentials, decodeToken } from '../../common/security/token.security.js';
import { LogoutEname, TokenTypeEname } from '../../common/enums/security.enum.js';
import { badRequestException, conflictException } from '../../common/utils/response/error.response.js';
import { rsaDecrypt } from '../../common/security/rsa.security.js';
import { tokenModel } from '../../DB/model/token.model.js';
import { ACCESS_EXPIRES_IN, REFRESH_EXPIRES_IN } from '../../../config/config.service.js';
import { baseRevokeTokenKey, deleteKey, keys, revokeTokenKey, set } from '../../common/services/redis.service.js';

const createRevokeToken = async ({ jti ,iat,sub}) => {
    await set({
        key: revokeTokenKey({ userId: sub, jti }),
        value: jti,
        ttl: iat + REFRESH_EXPIRES_IN
    })
    return;
}

export const logout = async ({ flag }, user, { jti, iat, sub }) => {
    let status = 200
    switch (flag) {
        case LogoutEname.All:
            user.changeCredentialsTime = new Date()
            await user.save()

            await deleteKey(await keys(baseRevokeTokenKey(sub)))


            break;

        default:
            await createRevokeToken({
                userId: sub,
                jti,
                ttl: iat + REFRESH_EXPIRES_IN
            })

            status = 201

            break;
    }
    return status
}

export const profile = async (user) => {

    return user
}
export const shareProfile = async (userId) => {
    const profile = await findOne({
        model: userMadel,
        filter: {
            _id: userId
        },
        select: "firstName lastName userName email phone picture"
    })
    if (profile.phone) {
        profile.phone = await rsaDecrypt(profile.phone)
    }
    return profile
}

export const rotateToken = async (user, { sub, jti, iat }, issuer) => {
    if ((iat + ACCESS_EXPIRES_IN) * 1000 > Date.now() + (30000)) {
        throw conflictException({ message: "Current access token still valid" })
    }

    await createRevokeToken({
        userId: sub,
        jti,
        ttl: iat + REFRESH_EXPIRES_IN
    })


    return await createLoginCredentials(user, issuer)
}

export const profileImage = async (file, user) => {

    user.profilePicture = file.finalPath
    await user.save()
    return user;
};

export const profileCoverImage = async (files, user) => {

    user.coverprofilePicture = files.map(file => file.finalPath)
    await user.save()
    return user;
};
