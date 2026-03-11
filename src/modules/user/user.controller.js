import { Router } from "express";
import { logout, profile, profileCoverImage, profileImage, rotateToken, shareProfile } from "./user.service.js";
import { successResponse } from "../../common/utils/response/success.response.js";
import { authentication, authorization } from "../../middleware/authentication.middleware.js";
import { TokenTypeEname } from "../../common/enums/security.enum.js";
import { RoleEname } from "../../common/enums/user.enum.js";
import * as validators from './user.validation.js';
import { validation } from './../../middleware/validation.middleware.js';
import { localFileUpload } from '../../common/utils/multer/local.multer.js';
import { fileFieldValidation } from '../../common/utils/multer/index.js';

const router = Router()



router.post("/logout", authentication(), async (req, res, next) => {
    const status = await logout(req.body, req.user, req.decoded)
    return successResponse({ res, status })

})
router.get("/", authentication(), authorization([RoleEname.User, RoleEname.Admin]), async (req, res, next) => {
    const account = await profile(req.user)
    return successResponse({ res, data: { account } })

})

router.get("/:userId/share-profile", validation(validators.shareProfile), async (req, res, next) => {
    const account = await shareProfile(req.params.userId)
    return successResponse({ res, data: { account } })

})

router.get("/rotate", authentication(TokenTypeEname.refresh), async (req, res, next) => {
    const credentials = await rotateToken(req.user, req.decoded, `${req.protocol}://${req.host}`)
    return successResponse({ res, data: { ...credentials } })

})




router.patch("/profile-image", authentication(),
    localFileUpload({
        customPath: 'users/profile',
        validation: fileFieldValidation.image,
        maxSize: 5
    }).single("attachment"), validation(validators.profileImage), async (req, res, next) => {

        const account = await profileImage(req.file, req.user);
        return successResponse({ res, data: { account } });

    });

router.patch("/profile-cover-image", authentication(),
    localFileUpload({
        customPath: 'users/profile/cover',
        validation: fileFieldValidation.image,
        maxSize: 5
    }).array("attachment", 5), validation(validators.profileCoverImage), async (req, res, next) => {

        const account = await profileCoverImage(req.files, req.user);
        return successResponse({ res, data: { account } });

    });


export default router