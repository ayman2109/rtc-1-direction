"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
let id = 100;
let sender = null;
let receiver = new Map();
const wss = new ws_1.WebSocketServer({ port: 8080 });
wss.on('connection', (ws) => {
    ws.on('error', console.error);
    ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type == 'sender') {
            sender = ws;
        }
        else if (message.type == 'receiver') {
            const newId = String(++id);
            receiver.set(newId, ws);
            console.log('new receiver');
            ws.send(JSON.stringify({ type: 'id', id: newId }));
            console.log("sending this message to the sender");
            sender === null || sender === void 0 ? void 0 : sender.send(JSON.stringify({ type: 'newReceiver', receiverId: newId }));
        }
        if (message.type == 'createOffer') {
            const receiverId = message.receiverId;
            const receiverSocket = receiver.get(receiverId);
            receiverSocket === null || receiverSocket === void 0 ? void 0 : receiverSocket.send(JSON.stringify({ type: "createOffer", sdp: message.sdp }));
        }
        if (message.type == 'createAnswer') {
            console.log("answer here", message.receiverId);
            sender === null || sender === void 0 ? void 0 : sender.send(JSON.stringify({ type: "createAnswer", sdp: message.sdp, receiverId: message.receiverId }));
        }
        if (message.type == 'iceCandidate') {
            const receiverId = message.receiverId;
            const receiverSocket = receiver.get(receiverId);
            if (ws === sender) {
                receiverSocket === null || receiverSocket === void 0 ? void 0 : receiverSocket.send(JSON.stringify({ type: "iceCandidate", candidate: message.candidate }));
            }
            else if (ws === receiverSocket) {
                sender === null || sender === void 0 ? void 0 : sender.send(JSON.stringify({ type: "iceCandidate", candidate: message.candidate }));
            }
        }
    });
});
