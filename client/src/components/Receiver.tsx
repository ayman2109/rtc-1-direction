import { useEffect, useRef } from 'react';

const Receiver = () => {
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const currentVideoRef = useRef<HTMLVideoElement | null>(null)


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

        pc.onicecandidate = async (event) => {
            if (event.candidate) {
                socket.send(
                    JSON.stringify({ type: 'iceCandidate', candidate: event.candidate })
                );
            }
        };

        pc.ontrack = (event) => {
          if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = new MediaStream([event.track]);
          }
      };
      

        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            if (message.type === 'createOffer') {
                console.log('offer got');
                await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.send(
                    JSON.stringify({ type: 'createAnswer', sdp: pc.localDescription })
                );
            } else if (message.type === 'iceCandidate') {
                console.log('ice got');
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
            <div>Other Guy:</div>
            <video ref={remoteVideoRef} autoPlay playsInline></video>
            <button onClick={handleClick}>Start Receiving</button>
           
        </>
    );
};

export default Receiver;
