import { Router } from "express"
import { successResponse } from "../../common/utils/response/success.response.js"
import * as validators from './message.validation.js';
import { validation } from "../../middleware/validation.middleware.js";
import { badRequestException } from "../../common/utils/response/error.response.js";
import { deleteMessage, getMessage, messageList, sendMessage } from "./message.service.js";
import { localFileUpload } from "../../common/utils/multer/local.multer.js";
import { fileFieldValidation } from "../../common/utils/multer/validation.multer.js";
import { decodeToken } from "../../common/security/token.security.js";
import { TokenTypeEname } from "../../common/enums/security.enum.js";
import { authentication } from "../../middleware/authentication.middleware.js";

const router = Router()

router.post("/:receiverId", async (req, res, next) => {
    if (req.headers?.authorization) {
        const { user, decoded } = await decodeToken({ token: req.headers.authorization.split(" ")[1], tokenType: TokenTypeEname.access })
        req.user = user;
        req.decoded = decoded
    }
    next();
},
    localFileUpload({ validation: fileFieldValidation.image, customPath: "Message", maxSize: 1 }).array("attachment", 2),
    validation(validators.sendMessage), async (req, res, next) => {

        if (!req.files && !req.body?.content) {
            throw badRequestException({ message: "Validation error", extra: [{ path: ['content'], key: "body", message: 'missing content' }] })
        }

        const message = await sendMessage(req.params.receiverId, req.files, req.body, req.user)
        return successResponse({ res, status: 201, data: { message } })

    })

router.delete("/:messageId", authentication(),
    validation(validators.verifyMessage),
    async (req, res, next) => {

        const message = await deleteMessage(req.params.messageId, req.user)
        return successResponse({ res, status: 200, data: { message } })

    })


router.get("/list", authentication(),
    async (req, res, next) => {

        const messages = await messageList(req.user)
        return successResponse({ res, status: 200, data: { messages } })

    })

router.get("/:messageId", authentication(),
    validation(validators.verifyMessage),
    async (req, res, next) => {

        const message = await getMessage(req.params.messageId, req.user)
        return successResponse({ res, status: 200, data: { message } })

    })





export default router