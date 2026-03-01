import { badRequestException } from "../common/utils/response/error.response.js"

export const validation =(schema)=>{
    return(req,res,next)=>{
        const validationResult = schema.validate(req.body ,{abortEarly:false})
        if(validationResult,error){
            throw badRequestException({message:"valdation error"})
        }
        next()
    }
}