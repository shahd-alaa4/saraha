
import joi from 'joi';
import { generalValidatiotionFields } from '../../common/utils/validation.js';
import { fileFieldValidation } from '../../common/utils/multer/validation.multer.js';

export const shareProfile = {
  params: joi.object().keys({
    userId: generalValidatiotionFields.id.required()
  }).required()
}

export const profileImage = {
  file: generalValidatiotionFields.file(fileFieldValidation.image).required()
}

export const profileCoverImage = {
  files: joi.array().items(
    generalValidatiotionFields.file(fileFieldValidation.image).required()
  ).min(1).max(5).required()
}
export const profileAttachment = {
  files: joi.object().keys({
    profileImage: joi.array().items(
      generalValidatiotionFields.file(fileFieldValidation.image).required()
    ).required(),
    profileCoverImage: joi.array().items(
      generalValidatiotionFields.file(fileFieldValidation.image).required()
    ).min(1).max(5).required()
  }).required()

}