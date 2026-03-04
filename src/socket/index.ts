import { Server } from "socket.io";
import type { activeRoomDetails, roomDetails, socketDetails } from "../utils/types.js";
import { calculateBreaks, findPartner } from "./utils/matchmaking.js";
import { startTimer } from "./utils/timer.js";

const waitingQueue=<socketDetails[]>[]
const activeConnections=<activeRoomDetails[]>[]
const connections=<roomDetails[]>[]

export function registerSocket(io:Server){
    startTimer(activeConnections,io)

    io.on('connection',(socket)=>{
    console.log(`${socket.id} connected!`)

    socket.on("FIND_PARTNER",(duration:number)=>{
        findPartner(waitingQueue,connections,duration,socket,io)
    })
    socket.on("SESSION_START",(roomId:string)=>{
        const connection=connections.find((connection)=>connection.roomId==roomId)
        if(!connection) return

        connection.readyUsers.push(socket.id)
        if(connection.readyUsers.length==2){
            const startTime=Date.now()
            const breakDetails=calculateBreaks(connection.breakCount,startTime);
            const newActiveConnection:activeRoomDetails={
                type:"FOCUS",
                startTime:startTime,
                breaks:breakDetails,
                ...connection
            }

            const connectionIndex=connections.findIndex((c)=>c.roomId==connection.roomId)
            if(connectionIndex!=-1){
                connections.splice(connectionIndex,1)
            }
            activeConnections.push(newActiveConnection)
            io.to(newActiveConnection.roomId).emit("SESSION_STARTED",newActiveConnection)
        }
    })

    socket.on('disconnect',()=>{
        const disconnectedIndex=waitingQueue.findIndex((detail)=>detail.socketId===socket.id)
        if(disconnectedIndex!=-1){
            waitingQueue.splice(disconnectedIndex,1)
        }
        const activeConnectionIndex=activeConnections.findIndex((connection)=>connection.users.includes(socket.id))
        if(activeConnectionIndex!=-1){
            io.to(activeConnections[activeConnectionIndex]!.roomId).emit("SESSION_QUIT")
            activeConnections.splice(activeConnectionIndex,1)
        }
        const connectionIndex=connections.findIndex((connection)=>connection.users.includes(socket.id))
        if(connectionIndex!=-1){
            io.to(connections[connectionIndex]!.roomId).emit("SESSION_LEFT")
            connections.splice(connectionIndex,1)
        }
        console.log(`${socket.id} disconnected!`)
    })
})
}