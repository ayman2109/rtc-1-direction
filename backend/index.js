"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
let sender = null;
let receiver = null;
const wss = new ws_1.WebSocketServer({ port: 8080 });
wss.on('connection', (ws) => {
    ws.on('error', console.error);
    ws.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type == 'sender') {
            sender = ws;
        }
        else if (message.type == 'receiver') {
            receiver = ws;
        }
        if (message.type == 'createOffer') {
            receiver === null || receiver === void 0 ? void 0 : receiver.send(JSON.stringify({ type: "createOffer", sdp: message.sdp }));
        }
        if (message.type == 'createAnswer') {
            sender === null || sender === void 0 ? void 0 : sender.send(JSON.stringify({ type: "createAnswer", sdp: message.sdp }));
        }
        if (message.type == 'iceCandidate') {
            if (ws === sender) {
                receiver === null || receiver === void 0 ? void 0 : receiver.send(JSON.stringify({ type: "iceCandidate", candidate: message.candidate }));
            }
            else if (ws === receiver) {
                sender === null || sender === void 0 ? void 0 : sender.send(JSON.stringify({ type: "iceCandidate", candidate: message.candidate }));
            }
        }
    });
});
