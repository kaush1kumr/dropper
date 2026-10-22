// ============================================================================
// Socket.IO Client Service
// ============================================================================
// Manages the connection to the signaling server.
// We keep a single reusable socket instance across components.
// ============================================================================

import { io } from "socket.io-client";
import { SIGNALING_SERVER_URL } from "../utils/constants";

let socket = null;

/**
 * Get or create the active Socket.IO connection
 * @returns {Socket} Active socket instance
 */
export function getSocket() {
  if (!socket) {
    socket = io(SIGNALING_SERVER_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("[Signaling] Connected to server with ID:", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.warn("[Signaling] Connection error:", error.message);
    });
  }

  return socket;
}

/**
 * Disconnect and clear the current socket instance
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
