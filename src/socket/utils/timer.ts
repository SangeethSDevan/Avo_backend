import type { Server } from "socket.io"
import type { activeRoomDetails } from "../../utils/types.js"

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
                    io.to(connection.roomId).emit("BREAK_START")
                    connection.type='BREAK'
                    connection.breaks[batchIndex]!.status='STARTED'
                }
                if(brDetail.status=='STARTED' && brDetail.end<=current){
                    io.to(connection.roomId).emit("BREAK_END")
                    connection.breaks[batchIndex]!.status='ENDED'
                    connection.type='FOCUS'
                    connection.batchCount++
                }
            }
            if(remainingTime<0){
                io.to(connection.roomId).emit("SESSION_ENDED")
                const connectionIndex=activeConnections.findIndex((c)=>c.roomId==connection.roomId)
                activeConnections.splice(connectionIndex,1)
                continue
            }
            io.to(connection.roomId).emit("TIMER_STAT",remainingTime)
        }
    },1000)
}
