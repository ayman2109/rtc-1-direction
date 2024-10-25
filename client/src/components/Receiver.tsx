
import { useEffect, useRef } from 'react';

const Receiver = () => {
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const receiverIdRef = useRef<string>('');

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080');

        socket.onopen = () => {
            socket.send(JSON.stringify({ type: 'receiver' }));
        };

        socket.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };

        startReceiving(socket);

        // Cleanup WebSocket on unmount
        return () => {
            socket.close();
        };
    }, []);

    function startReceiving(socket: WebSocket) {
        const pc = new RTCPeerConnection();

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.send(
                    JSON.stringify({ type: 'iceCandidate', candidate: event.candidate, receiverId: receiverIdRef.current })
                );
            }
        };

        // Create a MediaStream to manage multiple tracks
        const remoteStream = new MediaStream();

        pc.ontrack = (event) => {
            console.log('Track received:', event.track);
            remoteStream.addTrack(event.track);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
            }
        };

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'id') {
              receiverIdRef.current = message.id
              console.log(receiverIdRef)
            } ;
  
            if (message.type === 'createOffer') {
                console.log('Offer received');
                await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.send(
                    JSON.stringify({ type: 'createAnswer', sdp: pc.localDescription, receiverId: receiverIdRef.current })
                );
            } else if (message.type === 'iceCandidate') {
                console.log('ICE candidate received');
                if (message.candidate) {
                    await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
                }
            } 
        };
    }

    function handleClick() {
        if (remoteVideoRef.current) {
            remoteVideoRef.current.play().catch(console.error);
        }
    }

    return (
        <>
            <div>Receiver:  </div>
            <video ref={remoteVideoRef} autoPlay playsInline></video>
            <button onClick={handleClick}>Start Receiving</button>
        </>
    );
};

export default Receiver;

