import express from "express"
import { loginUser, signUpUser } from "../controllers/userController.js"

const userRouter=express.Router()

userRouter.post("/signup",signUpUser)
    .post("/login",loginUser)

export default userRouter