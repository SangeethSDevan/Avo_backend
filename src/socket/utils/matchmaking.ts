import type { Server, Socket } from "socket.io";
import type { socketDetails, roomDetails, breaks} from "../../utils/types.js";
import { prisma } from "../../utils/prisma.js";

export async function findPartner(
    waitingQueue:socketDetails[],
    connections:roomDetails[],
    duration:number,
    socket:Socket,
    category:"Study"|"Coding"|"Workout"|"Meditation"|"Reading",
    io:Server,
    socketIdMap:Map<string,string>
) {
    let matchIndex = waitingQueue.findIndex((sockets) => sockets.duration === duration && sockets.category==category)
    if(matchIndex==-1){
        matchIndex= waitingQueue.findIndex((sockets) => sockets.duration === duration)
    }
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
            readyCount:0,
        }
        
        const userId=socketIdMap.get(socket.id);
        const partnerId=socketIdMap.get(socketDetail!.socketId);

        if(!userId || !partnerId){
            socket.emit("AUTH_ERROR")
            return
        }

        const userData=await prisma.users.findMany({
            where:{
                userId:{
                    in:[userId,partnerId]
                }
            }
        })

        const currentUser=userData.find(u=>u.userId==userId);
        const partnerUser=userData.find(u=>u.userId==partnerId);

        socket.join(newConnection.roomId)
        const partnerSocket = io.sockets.sockets.get(socketDetail!.socketId)
        if (!partnerSocket) {
            socket.emit("PARTNER_ERROR")
            return
        }
        partnerSocket.join(newConnection.roomId)

        connections.push(newConnection)
        socket.emit("MATCH_FOUND",{
            roomId:newConnection.roomId,
            duration:newConnection.duration,
            partner:{
                name:partnerUser?.name,
                category:socketDetail?.category
            }
        })

        partnerSocket.emit("MATCH_FOUND",{
            roomId:newConnection.roomId,
            duration:newConnection.duration,
            partner:{
                name:currentUser?.name,
                category:category
            }
        })
        
    } else {
        const newSocketDetail: socketDetails = {
            socketId: socket.id,
            duration: duration,
            category:category
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