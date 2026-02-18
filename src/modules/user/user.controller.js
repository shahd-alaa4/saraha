import { Router } from "express";
import { profile } from "./user.service.js";
const router=Router()

router.get("/" , async (req,res,next)=>{
    const result  = await profile(req.headers.authorization)
    return res.status(200).json({message:"Profile" , result})
})
export default router