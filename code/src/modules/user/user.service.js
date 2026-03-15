import jwt from 'jsonwebtoken';
import { create, deleteMany, findById, findOne, updateOne } from './../../DB/database.repository.js';
import { userMadel } from '../../DB/index.js';
import { createLoginCredentials, decodeToken } from '../../common/security/token.security.js';
import { LogoutEname, TokenTypeEname } from '../../common/enums/security.enum.js';
import { badRequestException, conflictException } from '../../common/utils/response/error.response.js';
import { rsaDecrypt } from '../../common/security/rsa.security.js';
import { tokenModel } from '../../DB/model/token.model.js';
import { ACCESS_EXPIRES_IN, REFRESH_EXPIRES_IN } from '../../../config/config.service.js';
import { baseRevokeTokenKey, deleteKey, keys, revokeTokenKey, set } from '../../common/services/redis.service.js';
import { compareHash, generateHash } from '../../common/security/hash.security.js';
import fs from 'fs';


const createRevokeToken = async ({ jti, iat, sub }) => {

await set({
    key: revokeTokenKey({ userId: sub, jti }),
    value: jti,
    ttl: REFRESH_EXPIRES_IN
})

return;
}


export const logout = async ({ flag }, user, { jti, iat, sub }) => {
    let status = 200
    switch (flag) {
        case LogoutEname.All:
            user.changeCredentialsTime = new Date()
            await user.save()

await deleteKey(await keys(baseRevokeTokenKey({ userId: sub })))

            break;

        default:
            await createRevokeToken({
                 jti,
                 iat,
                 sub
            })

            status = 201

            break;
    }
    return status
}

export const updatePasswrd = async ({oldPassword,password},user,issuer) => {
if (!await compareHash({plaintext:oldPassword,cipherText:user.password})) {
    throw conflictException({message:"Invalid old password"})
}
if (!await compareHash({plaintext:oldPassword,cipherText:user.password})) {
   
for (const hash of user.oldPassword || []) {
    throw conflictException({message:"This password already used befor please try another one"})
} 
}



user.oldPassword.push(user.password)
user.password = await generateHash({plaintext:password})
user.changeCredentialsTime= new Date(Date.now())
await user.save()
await deleteKey(await keys(baseRevokeTokenKey({userId:user._id})))
    return await createLoginCredentials(user,issuer)
}

export const profile = async (user) => {

    return user
}

export const shareProfile = async (userId) => {

    await updateOne({
        model: userMadel,
        filter: { _id: userId },
        update: { $inc: { profileVisits: 1 } }
    })

    const profile = await findOne({
        model: userMadel,
        filter: {
            _id: userId,
            
        },
        select: "firstName lastName userName email phone picture profileVisits"
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

    if(user.profilePictures){
        user.gallery.push(user.profilePictures);
    }

   user.profilePictures = file.finalPath
    await user.save()
    return user;
};

export const profileCoverImage = async (files, user) => {

    const total = user.coverProfilePictures.length + files.length

if(total != 2){
 throw badRequestException({message:"Cover images must equal 2"})
}
    user.coverProfilePictures = files.map(file => file.finalPath)
    await user.save()
    return user;
};


export const removeProfileImage = async (user) => {
    if (!user.profilePictures) {
        throw badRequestException({ message: "No profile image to remove" });
    }

    fs.unlinkSync(user.profilePictures);
    user.profilePictures = null;

    await user.save();

    return user;
};