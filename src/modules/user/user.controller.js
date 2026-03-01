import { Router } from "express";
import { profile, rotateToken, uploadCover, uploadProfile } from "./user.service.js";
import { successResponse } from "../../common/utils/response/success.response.js";
import { authentication, authorization } from"../../middleware/authentication.middleware.js";
import { TokenTypeEname } from "../../common/enums/security.enum.js";
import { RoleEname } from "../../common/enums/user.enum.js";
import { uploadMultipleImages, uploadSingleImage } from "../../middleware/multer.middleware.js";
const router=Router()

router.get("/" , authentication(),authorization([RoleEname.user,RoleEname.Admin]),async (req,res,next)=>{
    const account  = await profile(req.user)
        return successResponse({res , data:{account}})
    
})

router.get("/rotate" ,  authentication(TokenTypeEname.refresh),async (req,res,next)=>{
    const account  = await rotateToken(req.user,`${req.protocol}://${req.host}`)
        return successResponse({res , data:{account}})
    
})

router.patch("/upload-profile", authentication(), async (req, res, next) => {
  uploadSingleImage(req, res, async (err) => {
    
      const filename = await uploadProfile(req.user._id, req.file);
      return successResponse({ res, message: "Profile uploaded", data: filename });
    
  });
});

router.patch("/upload-cover", authentication(), async (req, res, next) => {
  uploadMultipleImages(req, res, async (err) => {

      const filenames = await uploadCover(req.user._id, req.files);
      return successResponse({ res, message: "Cover uploaded", data: filenames });
    
  });
});


export default router