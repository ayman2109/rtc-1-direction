import { useState, useEffect, useRef } from 'react';

const Sender = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map()); // Track multiple connections
  
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

    // Handle incoming messages from the server
    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);

      // Handle messages for different peer connections (based on a unique ID)
      if (message.type === 'createAnswer') {
        const pc = peerConnections.current.get(message.receiverId); // Assuming a receiverId is sent
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
        }
      } else if (message.type === 'iceCandidate') {
        const pc = peerConnections.current.get(message.receiverId);
        if (pc && message.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(message.candidate));
        }
      }
    };

    // Get video stream and share it
    getVideoStream();
  }

  async function getVideoStream() {
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
      
      // Create a peer connection for each receiver and start sending video
      socket?.onmessage = async (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'newReceiver') {
          const receiverId = message.receiverId;
          const pc = createPeerConnection(receiverId, stream); // Create connection for each receiver

          // Start negotiation for the new receiver
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.send(JSON.stringify({
            type: 'createOffer',
            sdp: pc.localDescription,
            receiverId: receiverId // Send the receiver ID with the offer
          }));
        }
      };

    } catch (error) {
      console.error('Error getting video stream:', error);
    }
  }

  function createPeerConnection(receiverId: string, stream: MediaStream) {
    const pc = new RTCPeerConnection();

    // Add tracks to the new peer connection
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

    peerConnections.current.set(receiverId, pc); // Track the peer connection for the receiver
    return pc;
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
