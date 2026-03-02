import express from "express"
import { acceptRequest, addFriends, deleteRequest, getFriends } from "../controllers/friendController.js"

const friendRouter=express.Router()

friendRouter.get("/",getFriends)
    .post("/add",addFriends)
    .post("/accept",acceptRequest)
    .delete("/delete",deleteRequest)

export default friendRouter