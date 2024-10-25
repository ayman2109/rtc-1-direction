import { WebSocket, WebSocketServer} from "ws"

let sender: WebSocket | null = null
let receiver: WebSocket | null = null

const wss = new WebSocketServer({ port: 8080 })

wss.on('connection', (ws) =>  {
    ws.on('error', console.error)
    

    ws.on('message', (data: any) => {
        const message = JSON.parse(data)


        if(message.type == 'sender') {
            sender = ws
        } else if (message.type == 'receiver') {
            receiver = ws
        }

        if(message.type == 'createOffer') {
            receiver?.send(JSON.stringify({ type: "createOffer", sdp: message.sdp }))
        }

        if(message.type == 'createAnswer') {
            sender?.send(JSON.stringify({ type: "createAnswer", sdp: message.sdp }))
        }

        if(message.type == 'iceCandidate') {
            if (ws === sender) {
                receiver?.send(JSON.stringify({ type: "iceCandidate", candidate: message.candidate }))
            } else if (ws === receiver) {
                sender?.send(JSON.stringify({ type: "iceCandidate", candidate: message.candidate }))
            }
        }

    })
    
})