import { useState, useEffect, useRef } from 'react';

const Sender = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

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
    if (!socket) return;

    const pc = new RTCPeerConnection();

    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'createAnswer') {
        await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
      } else if (message.type === 'iceCandidate') {
        if (message.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
        }
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.send(
          JSON.stringify({
            type: 'iceCandidate',
            candidate: event.candidate,
          })
        );
      }
    };

    pc.onnegotiationneeded = async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.send(
          JSON.stringify({ type: 'createOffer', sdp: pc.localDescription })
        );
      } catch (error) {
        console.error('Error during negotiation:', error);
      }
    };

    getVideoStream(pc);
  }

  async function getVideoStream(pc: RTCPeerConnection) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log('Video stream acquired');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    } catch (error) {
      console.error('Error getting video stream:', error);
    }
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
