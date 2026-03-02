import type { Server, Socket } from "socket.io";
import type { socketDetails, roomDetails, breaks} from "../../utils/types.js";

export function findPartner(
    waitingQueue:socketDetails[],
    connections:roomDetails[],
    duration:number,
    socket:Socket,
    io:Server
) {
    const matchIndex = waitingQueue.findIndex((sockets) => sockets.duration === duration)
    if (matchIndex !== -1) {
        const socketDetail = waitingQueue[matchIndex]
        waitingQueue.splice(matchIndex, 1)
        let breakCount: number;

        if (duration == 1) {
            breakCount = 1
        } else if (duration < 1) {
            breakCount = 0
        } else {
            breakCount = duration * 2-1
        }

        const newConnection: roomDetails = {
            roomId: crypto.randomUUID(),
            users:[
                socket.id,
                socketDetail!.socketId
            ],
            duration: duration,
            breakCount:breakCount,
            batchCount:1,
            readyCount:0
        }
        socket.join(newConnection.roomId)
        const partnerSocket = io.sockets.sockets.get(socketDetail!.socketId)
        if (!partnerSocket) {
            socket.emit("PARTNER_ERROR", "Partner disconnected!")
            return
        }
        partnerSocket.join(newConnection.roomId)
        connections.push(newConnection)
        io.to(newConnection.roomId).emit("MATCH_FOUND",newConnection)
    } else {
        const newSocketDetail: socketDetails = {
            socketId: socket.id,
            duration: duration
        }
        waitingQueue.push(newSocketDetail)
        socket.emit("WAITING_FOR_PARTNER")
    }
}

export function calculateBreaks(breakCount:number,startTime:number){
    const breaks:breaks[]=[]
    for(let i=1;i<=breakCount;i++){
        const breakStartHr=((30/60)*i)+((5/60)*(i+1))
        const breakStartMs=breakStartHr*60*60*1000
        const breakEndMs=breakStartMs+(5*60*1000)

        const newBreak:breaks={
            start:startTime+breakStartMs,
            end:startTime+breakEndMs,
            status:"PROGRESS"
        }
        breaks.push(newBreak)
    }
    return breaks
}