// ============================================================================
// Constants & Configuration
// ============================================================================
// Central place for configuration settings like STUN servers, chunk sizes,
// and server connection URLs.
// ============================================================================

// Signaling server URL
// Automatically uses the current hostname with port 5000 so it works across
// devices on your local network (e.g., your laptop and phone on the same Wi-Fi)
const getSignalingUrl = () => {
  if (process.env.REACT_APP_SIGNALING_SERVER) {
    return process.env.REACT_APP_SIGNALING_SERVER;
  }
  const hostname = window.location.hostname || "localhost";
  return `http://${hostname}:5000`;
};

export const SIGNALING_SERVER_URL = getSignalingUrl();

// Public Google STUN servers.
// STUN (Session Traversal Utilities for NAT) allows peers to discover their
// public IP addresses and open network ports to establish a direct P2P connection.
export const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

// 16 KB chunk size for WebRTC DataChannel.
// 16384 bytes (16 KB) is the universally safe chunk size recommended
// for WebRTC across Chrome, Firefox, Safari, and Edge.
export const CHUNK_SIZE = 16 * 1024;

// Flow control threshold:
// If WebRTC's internal buffer exceeds this limit (64 KB), we pause reading
// the file until the buffer empties. This prevents memory overflow with big files!
export const BUFFER_THRESHOLD = 64 * 1024;
