import jwt from 'jsonwebtoken';
import { findById } from './../../DB/database.repository.js';
import { userMadel } from '../../DB/index.js';

export const profile   = async(authorization)=>{
   const decoded = jwt.decode(authorization)
   console.log({decoded});
   const verifyData = jwt.verify(authorization,TOKEN_SECRET_KEY)
   console.log({verifyData});

   const user = await findById({
    model:userMadel,
    id:verifyData.sub
   })
   
    return user
}