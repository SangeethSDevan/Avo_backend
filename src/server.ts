import dotenv from "dotenv"
import app from "./app.js"
import http from 'http'
import "./socket/index.js"
import { Server } from "socket.io"
import { registerSocket } from "./socket/index.js"

dotenv.config()

const server=http.createServer(app);
const PORT=process.env.PORT||3000

const io=new Server(server)
registerSocket(io)

server.listen(PORT,()=>{
    console.log(`Server running on PORT ${PORT}`)
})
