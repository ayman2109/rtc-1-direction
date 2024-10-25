import { useState, useEffect, useRef } from 'react';

const Sender = () => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map())


    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080');
        socket.onopen = () => socket.send(JSON.stringify({ type: 'sender' }));




        setSocket(socket);

        // Cleanup on unmount
        return () => {
            socket.close();
        };
    }, []);

    function startSharing() {
        console.log('start sharing')
        if (!socket) return;
        console.log("i am here")
        // Logic when answer or ice candidates received from the receiver side
        console.log("good till now")
        getVideoStream()
    };

    async function getVideoStream() {
        if (!socket) return
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        if (videoRef.current) {
            videoRef.current.srcObject = stream
            videoRef.current.play()
        }
        console.log("good till here as well")
        // when a new receiver arrives creates a new RPC connection and saves it to existing map
        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data)
            const pc = peerConnections.current.get(message.receiverId)
            console.log(message.type)
            if (message.type === 'createAnswer') {
                console.log("answer received")
                if (pc) {
                    await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
                }
            } else if (message.type === 'iceCandidate') {
                if (pc && message.candidate) {
                    await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
                }
            } else if (message.type == 'newReceiver') {
                const receiverId = message.receiverId;
                const pc = createPeerConnection(receiverId, stream);
                peerConnections.current.set(receiverId, pc)
            }
        }
    }
    // creates a new RPC connection with ice candidates, tracks, negogiation logic
    function createPeerConnection(receiverId: String, stream: MediaStream) {
        console.log("executed")
        const pc = new RTCPeerConnection();
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        // Handle ICE candidates for the peer connection
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket?.send(JSON.stringify({
                    type: 'iceCandidate',
                    candidate: event.candidate,
                    receiverId: receiverId, // Send candidate for the correct receiver
                }));
            }
        };
        pc.onnegotiationneeded = async () => {
            try {
                console.log("offer send")
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket?.send(JSON.stringify({
                    type: 'createOffer',
                    sdp: pc.localDescription,
                    receiverId: receiverId, // Send offer with the receiver ID
                }));
            } catch (error) {
                console.error('Error during negotiation:', error);
            }
        };

        return pc
    }





    return (
        <>
            <div>Sender</div>
            <video ref={videoRef} autoPlay playsInline></video>
            <button onClick={startSharing}>Start sharing</button>
        </>
    );
};





export default Sender;
