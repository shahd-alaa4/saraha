import joi from "joi";
import { generalValidatiotionFields } from "../../common/utils/validation.js";
import { fileFieldValidation } from "../../common/utils/multer/validation.multer.js";

export const sendMessage = {
  params: joi.object().keys({
    receiverId: generalValidatiotionFields.id.required()
  }).required(),
  body: joi.object().keys({
    content: joi.string().min(2).max(10000)
  }),
  files: joi.array().items(generalValidatiotionFields.file(fileFieldValidation.image))
}

export const verifyMessage = {
  params: joi.object().keys({
    messageId: generalValidatiotionFields.id.required()
  }).required(),

}