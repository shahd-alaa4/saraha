import jwt from 'jsonwebtoken';
import { findById } from './../../DB/database.repository.js';
import { userMadel } from '../../DB/index.js';
import { createLoginCredentials, decodeToken } from '../../common/security/token.security.js';
import { TokenTypeEname } from '../../common/enums/security.enum.js';
import { badRequestException } from '../../common/utils/response/error.response.js';

export const profile = async (user) => {

    return user
}

export const rotateToken = async (user, issuer) => {

    return await createLoginCredentials(user, issuer)
}

export const uploadProfile = async (userId, file) => {
    if (!file) {
        throw badRequestException({ message: "No file uploaded" });
    }

    const user = await userMadel.findByIdAndUpdate(
        userId,
        { profilePictures: file.filename },
      { new: true }
    );
    return file.filename;
};

export const uploadCover = async (userId, files) => {
    if (!files?.length) {
        throw badRequestException({ message: "No file uploaded" });
    }
    const filenames = files.map(f => f.filename);
    const user = await userMadel.findByIdAndUpdate(
        userId, {
        $push: { coverProfilePictures: { $each: filenames } }
    },
        { new: true }
    );
    return filenames;
};
