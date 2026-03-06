import type { Request, Response } from "express";
import { prisma } from "../utils/prisma.js";
import { STATUS } from "../generated/prisma/enums.js";

export const getFriends=async(req:Request,res:Response)=>{
    const userID=req.user.userId
    if(!userID){
        return res.status(400).json({
            status:"fail",
            message:"userId not found!"
        })
    }
    try{
        const friendsDetails=await prisma.friends.findMany({
            where:{
                AND:[
                    {userId:userID},
                    {status:STATUS.CONFIRMED}
                ]
            },
            select:{
                friend:{
                    select:{
                        userId:true,
                        username:true,
                        name:true
                    }
                }
            }
        })
        return res.status(200).json({
            status:"success",
            message:"Friends fetched sucessfully",
            data:{
                length:friendsDetails.length,
                friends:friendsDetails
            }
        })
    }catch(error){
        return res.status(500).json({
            status:"fail",
            message: error instanceof Error?error.message:"Something went wrong!"
        })
    }
}
export const addFriends=async(req:Request,res:Response)=>{
    const userId=req.user.userId
    if(!userId){
        return res.status(400).json({
            status:"fail",
            message:"userId not found!"
        })
    }
    const friendId=req.query.fd as string
    if(!friendId){
        return res.status(400).json({
            status:"fail",
            message:"friendID not found!"
        })
    }
    if(userId===friendId) return res.status(400).json({
        status:"fail",
        message:"You can't sent request to yourself!"
    })
    try{
        await prisma.friends.create({
            data:{
                userId:userId,
                friendId:friendId
            }
        })
        return res.status(200).json({
            status:"success",
            message:"Request sent to your friend!"
        })
    }catch(error:any){
        if(error.code=="P2002"){
            return res.status(400).json({
                status:"fail",
                message:"Request already sent or accepted!"
            })
        }
        return res.status(500).json({
            status:"fail",
            message:error instanceof Error?error.message:"Something went wrong!"
        })
    }
}
export const acceptRequest=async(req:Request,res:Response)=>{
    const userId=req.user.userId
    if(!userId){
        return res.status(400).json({
            status:"fail",
            message:"userId not found!"
        })
    }
    const requestId=req.query.rd as string
    if(!requestId){
        return res.status(400).json({
            status:"fail",
            message:"friendID not found!"
        })
    }
    try{
        await prisma.$transaction(async(tx)=>{
            await tx.friends.update({
                where:{
                    userId_friendId:{
                        userId:requestId,
                        friendId:userId
                    }
                },
                data:{
                    status:STATUS.CONFIRMED
                }
            })
            await tx.friends.create({
                data:{
                    userId:userId,
                    friendId:requestId,
                    status:STATUS.CONFIRMED
                }
            })
        })
        return res.status(200).json({
            status:"success",
            message:"Friend request accepted!"
        })
    }catch(error:any){
        if (error.code === "P2025") {
            return res.status(404).json({
                status: "fail",
                message: "Friend request not found",
            });
        }
        if(error.code=="P2002"){
            return res.status(400).json({
                status:"fail",
                message:"Request already accepted!"
            })
        }
        return res.status(500).json({
            status:"fail",
            message:error instanceof Error?error.message:"Something went wrong!"
        })
    }
}
export const deleteRequest=async(req:Request,res:Response)=>{
    const userId=req.user.userId
    if(!userId){
        return res.status(400).json({
            status:"fail",
            message:"userId not found!"
        })
    }
    const requestId=req.query.rd as string
    if(!requestId){
        return res.status(400).json({
            status:"fail",
            message:"friendID not found!"
        })
    }
    try{
        await prisma.$transaction(async (tx)=>{
            const deletedRequest= await tx.friends.delete({
                where:{
                    userId_friendId:{
                        userId:userId,
                        friendId:requestId
                    }
                }
            })
            if(deletedRequest.status==STATUS.CONFIRMED){
                await tx.friends.delete({
                    where:{
                        userId_friendId:{
                            userId:requestId,
                            friendId:userId
                        }
                    }
                })
            }
        })
        return res.status(200).json({
            status:"success",
            message:"Request deleted successfully!"
        })
    }catch(error:any){
        if (error.code === "P2025") {
            return res.status(404).json({
                status: "fail",
                message: "Friend request not found",
            });
        }
        return res.status(500).json({
            status:"fail",
            message:error instanceof Error?error.message:"Something went wrong!"
        })
    }
}