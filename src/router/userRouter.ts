import express from "express"
import { addWaitingList, loginUser, signUpUser } from "../controllers/userController.js"

const userRouter=express.Router()

userRouter.post("/signup",signUpUser)
    .post("/login",loginUser)
    .post("/waitinglist",addWaitingList)

export default userRouter