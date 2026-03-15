
import { NODE_ENV, port } from '../config/config.service.js'
import { connectDB } from './DB/index.js'
import { authRouter, messageRouter, userRouter } from './modules/index.js'
import express from 'express'
import cors from "cors"
import { resolve } from 'node:path'
import { connectRedis } from './DB/redis.conection.js'
import helmet from 'helmet'

async function bootstrap() {
    const app = express()
    //convert buffer data
    app.set("trust proxy", true)
    app.use(cors(), helmet(), express.json())
    app.use("/uploads", express.static("uploads"));
    app.use("/uploads", express.static(resolve("../uploads")));

    //DB
    await connectDB()
    await connectRedis()
    //application routing
    app.get('/', (req, res) => res.send('Hello World!'))
    app.use('/auth', authRouter)
    app.use('/user', userRouter)
    app.use('/message', messageRouter)
    // app.use("/uploads", express.static(resolve("../uploads")));

    //invalid routing
    app.use('{/*dummy}', (req, res) => {
        return res.status(404).json({ message: "Invalid application routing" })
    })

    //error-handling
    app.use((error, req, res, next) => {
        const status = error.cause?.status ?? 500
        return res.status(status).json({
            error_message:
                status == 500 ? 'something went wrong' : error.message ?? 'something went wrong',
            stack: NODE_ENV == "development" ? error.stack : undefined
        })
    })

    app.listen(port, () => console.log(`Example app listening on port ${port}!`))
}
export default bootstrap