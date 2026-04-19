import express from 'express'
import userRouter from './router/userRouter.js'

import cookieParser from "cookie-parser"
import friendRouter from './router/friendRouter.js'
import { userAuth } from './middlewares/userAuth.js'
import path from 'node:path'
import { calculateStreak } from './controllers/streakController.js'

const app=express()

app.use(express.json())
app.use(cookieParser())
app.use(express.static("public"))
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/users",userRouter)
app.use("/api/v1/friends",userAuth,friendRouter)
app.use("/api/v1/streak",userAuth,calculateStreak)

app.get("/api/status",(req,res)=>{
    return res.status(200).json({
        status:"success",
        message:"Avo is active"
    })
})
app.get("/",(req,res)=>{
    res.sendFile(path.join(process.cwd(),'public','index.html'))
})

export default app