import type { Server } from "socket.io"
import type { activeRoomDetails } from "../../utils/types.js"
import { prisma } from "../../utils/prisma.js"

export function startTimer(activeConnections:activeRoomDetails[],io:Server){
    setInterval(()=>{
        if(activeConnections.length<1) return

        for(let i = activeConnections.length - 1; i>=0; i--){
            const connection:activeRoomDetails = activeConnections[i]!

            const focusMs=connection.duration*60*60*1000
            const breakMs=connection.breakCount*5*60*1000
            const endTime=connection.startTime+focusMs+breakMs
            const current=Date.now()

            const remainingTime=endTime-current
            const batchIndex=connection.batchCount-1
            const brDetail=connection.breaks[batchIndex]

            if(brDetail && connection.batchCount <= connection.breakCount){
                if(brDetail.status=='PROGRESS' && brDetail.start<=current){
                    connection.type='BREAK'
                    connection.breaks[batchIndex]!.status='STARTED'
                    io.to(connection.roomId).emit("BREAK_START",connection)
                }
                if(brDetail.status=='STARTED' && brDetail.end<=current){
                    connection.breaks[batchIndex]!.status='ENDED'
                    connection.type='FOCUS'
                    connection.batchCount++
                    io.to(connection.roomId).emit("BREAK_END",connection)
                }
            }
            if(remainingTime<0){
                io.to(connection.roomId).emit("SESSION_ENDED")
                try{
                    
                }catch(error){

                }
                const connectionIndex=activeConnections.findIndex((c)=>c.roomId==connection.roomId)
                activeConnections.splice(connectionIndex,1)
                continue
            }
            io.to(connection.roomId).emit("TIMER_STAT",remainingTime)
        }
    },1000)
}
