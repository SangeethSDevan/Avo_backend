export interface breaks{
    start:number,
    end:number,
    status:"STARTED"|"ENDED"|"PROGRESS"
}
export interface socketDetails{
    socketId:string,
    duration:number,
    category:"Study"|"Coding"|"Workout"|"Meditation"|"Reading"
}
export interface roomDetails{
    roomId:string,
    duration:number,
    batchCount:number
    breakCount:number
    users:string[]
    readyCount:number,
}
export interface activeRoomDetails extends roomDetails{
    type:"FOCUS"|"BREAK"
    startTime:number,
    breaks:breaks[],
}