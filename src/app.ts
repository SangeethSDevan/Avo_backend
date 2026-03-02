import express from 'express'
import userRouter from './router/userRouter.js'

import cookieParser from "cookie-parser"
import friendRouter from './router/friendRouter.js'
import { userAuth } from './middlewares/userAuth.js'

const app=express()

app.use(express.json())
app.use(cookieParser())

app.use("/api/v1/users",userRouter)
app.use("/api/v1/friends",userAuth,friendRouter)

export default app