import { WebSocket, WebSocketServer} from "ws"
let id = 100
let sender: WebSocket | null = null
let receiver: Map<string, WebSocket> = new Map()

const wss = new WebSocketServer({ port: 8080 })

wss.on('connection', (ws) =>  {
    ws.on('error', console.error)
    

    ws.on('message', (data: any) => {
        const message = JSON.parse(data)


        if(message.type == 'sender') {
            sender = ws
        } else if (message.type == 'receiver') {
            const newId = String(++id)
            receiver.set(newId, ws)
            console.log('new receiver')
            ws.send(JSON.stringify({type: 'id',  id: newId}))
            console.log("sending this message to the sender")
            sender?.send(JSON.stringify({type: 'newReceiver', receiverId: newId}))
        }

        if(message.type == 'createOffer') {
            
            const receiverId = message.receiverId
            
            const receiverSocket = receiver.get(receiverId)
            
            receiverSocket?.send(JSON.stringify({ type: "createOffer", sdp: message.sdp }))
        }

        if(message.type == 'createAnswer') {
            console.log("answer here", message.receiverId)
            sender?.send(JSON.stringify({ type: "createAnswer", sdp: message.sdp, receiverId: message.receiverId }))
        }

        if(message.type == 'iceCandidate') {
            const receiverId = message.receiverId
            const receiverSocket = receiver.get(receiverId)
            if (ws === sender) {
                receiverSocket?.send(JSON.stringify({ type: "iceCandidate", candidate: message.candidate }))
            } else if (ws === receiverSocket) {
                sender?.send(JSON.stringify({ type: "iceCandidate", candidate: message.candidate }))
            }
        }

    })
    
})

