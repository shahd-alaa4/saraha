import { TokenTypeEname } from "../common/enums/security.enum.js"
import { decodeToken } from "../common/security/token.security.js"
import { badRequestException, forbiddenException } from "../common/utils/response/error.response.js"

export const authentication = (tokenType=TokenTypeEname.access)=>{
    return async(req,res,next)=>{
        if(!req?.headers?.authorization){
            throw badRequestException({message:"missing authorization key"})
        }
const {authorization}= req.headers
console.log(authorization);

const [flag , credential] = authorization.split(" ")

        if (!flag || !credential) {
            throw badRequestException({message:"missing authorization parts"})
        }
console.log({flag,credential});

switch (flag) {
    case 'Basic':
        const data = Buffer.from(credential,'base64').toString();
        const [username,password] = data.split(":")
        console.log(data);
        console.log({username,password});
        
        
        break;

    case 'Bearer':
        req.user = await decodeToken({token: credential,tokenType})
        break;
}

 next()
    }
}

export const authorization = (accessRoles=[])=>{
    return async(req,res,next)=>{
        if(!accessRoles.includes(req.user.role)){
            throw forbiddenException({message:"Not allowed account"})
        }
 next()
    }
}