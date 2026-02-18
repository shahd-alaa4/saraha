import mongoose from "mongoose";
import { DB_URI } from "../../config/config.service.js";
import { userMadel } from "./model/user.model.js";

export const connectDB = async()=>{
    try{
const result = await mongoose.connect(DB_URI)
console.log("DB connected successfully");
//await userMadel.syncIndexes()
    }catch(error){
console.log(`fail to connect on DB : ${error}`);

    }
}