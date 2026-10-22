// ============================================================================
// WebRTC Peer Connection & DataChannel Manager
// ============================================================================
// How WebRTC file sharing works step-by-step:
// 1. Two browsers join the same room on the signaling server.
// 2. Peer A (Initiator) creates an RTCPeerConnection and an RTCDataChannel.
// 3. Peer A creates an "Offer" (SDP) and sends it to Peer B via the signaling server.
// 4. Peer B receives the Offer, creates an "Answer" (SDP), and sends it back.
// 5. Both peers exchange "ICE Candidates" (their network address routes).
// 6. Direct P2P connection opens! Files are transferred directly between
//    the two browsers via RTCDataChannel, never touching any server.
// ============================================================================

import { ICE_SERVERS, CHUNK_SIZE, BUFFER_THRESHOLD } from "../utils/constants";
import { generateTransferId } from "../utils/fileTransfer";

export class WebRTCManager {
  constructor({ socket, roomId, onStatusChange, onTransferUpdate, onChatMessage }) {
    this.socket = socket;
    this.roomId = roomId;

    // Callbacks to update React UI
    this.onStatusChange = onStatusChange || (() => {});
    this.onTransferUpdate = onTransferUpdate || (() => {});
    this.onChatMessage = onChatMessage || (() => {});

    // Core WebRTC objects
    this.peerConnection = null;
    this.dataChannel = null;

    // Queue for ICE candidates that arrive before remote description is ready
    this.iceCandidatesQueue = [];

    // Current state of receiving file
    this.incomingFile = null;

    // Flag to cancel ongoing file transfer
    this.isCancelled = false;

    // Bind signaling listeners from Socket.IO
    this.setupSignalingListeners();
  }

  // ==========================================================================
  // 1. Signaling Listeners (Socket.IO)
  // ==========================================================================
  setupSignalingListeners() {
    // When a second peer joins, the initiator starts the WebRTC handshake
    this.socket.on("peer-joined", async () => {
      console.log("[WebRTC] Peer joined room. Creating offer...");
      this.onStatusChange("connecting", "Peer detected. Establishing direct connection...");
      await this.createOffer();
    });

    // Received an Offer from peer -> create and send back an Answer
    this.socket.on("signal:offer", async ({ offer }) => {
      console.log("[WebRTC] Received offer from peer. Creating answer...");
      this.onStatusChange("connecting", "Received connection offer. Responding...");
      await this.handleOffer(offer);
    });

    // Received an Answer from peer -> complete handshake
    this.socket.on("signal:answer", async ({ answer }) => {
      console.log("[WebRTC] Received answer from peer.");
      await this.handleAnswer(answer);
    });

    // Received an ICE candidate (network route) from peer
    this.socket.on("signal:ice-candidate", async ({ candidate }) => {
      await this.handleIceCandidate(candidate);
    });

    // When the peer leaves or closes the tab
    this.socket.on("peer-left", () => {
      console.log("[WebRTC] Peer left the room.");
      this.cleanupConnection();
      this.onStatusChange("waiting", "Peer disconnected. Waiting for peer to reconnect...");
    });
  }

  // ==========================================================================
  // 2. PeerConnection Initialization
  // ==========================================================================
  initializePeerConnection() {
    if (this.peerConnection) return;

    // Create RTCPeerConnection with public STUN servers
    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);

    // Listen for connection state changes (e.g. connected, disconnected, failed)
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState;
      console.log(`[WebRTC] Connection state changed: ${state}`);

      if (state === "connected") {
        this.onStatusChange("connected", "Direct P2P connection established!");
      } else if (state === "disconnected" || state === "closed") {
        this.onStatusChange("waiting", "Connection closed. Waiting for peer...");
      } else if (state === "failed") {
        this.onStatusChange("failed", "Direct connection failed. Trying to reconnect...");
      }
    };

    // When this browser finds a network candidate, send it to the other peer
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit("signal:ice-candidate", {
          candidate: event.candidate,
          roomId: this.roomId,
        });
      }
    };

    // Recipient listens for the incoming DataChannel opened by the initiator
    this.peerConnection.ondatachannel = (event) => {
      console.log("[WebRTC] Data channel received by recipient.");
      this.setupDataChannel(event.channel);
    };
  }

  // ==========================================================================
  // 3. WebRTC Handshake (Offer / Answer / ICE)
  // ==========================================================================

  // Initiator: creates the DataChannel and sends the Offer
  async createOffer() {
    this.initializePeerConnection();

    // The initiator creates the RTCDataChannel for file transfer
    const channel = this.peerConnection.createDataChannel("fileTransfer", {
      ordered: true, // Guarantees file chunks arrive in exact order
    });
    this.setupDataChannel(channel);

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    this.socket.emit("signal:offer", {
      offer,
      roomId: this.roomId,
    });
  }

  // Recipient: receives the Offer, sets remote description, and returns Answer
  async handleOffer(offer) {
    this.initializePeerConnection();

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    // Process any queued ICE candidates that arrived before the offer was set
    await this.flushIceCandidatesQueue();

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    this.socket.emit("signal:answer", {
      answer,
      roomId: this.roomId,
    });
  }

  // Initiator: receives Answer and sets remote description
  async handleAnswer(answer) {
    if (!this.peerConnection) return;
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    await this.flushIceCandidatesQueue();
  }

  // Handle incoming ICE candidates
  async handleIceCandidate(candidate) {
    if (!candidate) return;

    const rtcCandidate = new RTCIceCandidate(candidate);

    // If remote description is ready, add candidate immediately; otherwise queue it
    if (this.peerConnection && this.peerConnection.remoteDescription) {
      try {
        await this.peerConnection.addIceCandidate(rtcCandidate);
      } catch (err) {
        console.warn("[WebRTC] Error adding ICE candidate:", err);
      }
    } else {
      this.iceCandidatesQueue.push(rtcCandidate);
    }
  }

  // Apply queued candidates once remote description is set
  async flushIceCandidatesQueue() {
    while (this.iceCandidatesQueue.length > 0) {
      const candidate = this.iceCandidatesQueue.shift();
      try {
        await this.peerConnection.addIceCandidate(candidate);
      } catch (err) {
        console.warn("[WebRTC] Error adding queued ICE candidate:", err);
      }
    }
  }

  // ==========================================================================
  // 4. DataChannel Setup & Handling
  // ==========================================================================
  setupDataChannel(channel) {
    this.dataChannel = channel;
    this.dataChannel.binaryType = "arraybuffer";

    // Set buffer threshold for flow control (when buffer is low, send more chunks)
    this.dataChannel.bufferedAmountLowThreshold = BUFFER_THRESHOLD;

    this.dataChannel.onopen = () => {
      console.log("[WebRTC] DataChannel opened! Ready for file transfer.");
      this.onStatusChange("connected", "Connected to peer! Ready to send files.");
    };

    this.dataChannel.onclose = () => {
      console.log("[WebRTC] DataChannel closed.");
    };

    this.dataChannel.onerror = (error) => {
      console.error("[WebRTC] DataChannel error:", error);
    };

    // Handle incoming messages (either JSON control messages or binary file slices)
    this.dataChannel.onmessage = (event) => {
      this.handleIncomingData(event.data);
    };
  }

  // ==========================================================================
  // 5. Receiving File Logic (Receiver Side)
  // ==========================================================================
  handleIncomingData(data) {
    // String message = JSON control message (metadata, end-of-file, cancel, or chat)
    if (typeof data === "string") {
      try {
        const message = JSON.parse(data);

        // 1. Peer started sending a new file
        if (message.type === "file-start") {
          this.incomingFile = {
            id: message.id,
            name: message.name,
            size: message.size,
            mimeType: message.mimeType || "application/octet-stream",
            receivedBytes: 0,
            chunks: [],
            startTime: Date.now(),
            lastProgressTime: Date.now(),
            lastReceivedBytes: 0,
            speed: 0,
            progress: 0,
            direction: "incoming",
            status: "transferring",
          };

          this.onTransferUpdate({ ...this.incomingFile });
        }

        // 2. Peer finished sending file chunks
        else if (message.type === "file-end") {
          if (!this.incomingFile || this.incomingFile.id !== message.id) return;

          // Assemble all binary chunks into a single Blob
          const fileBlob = new Blob(this.incomingFile.chunks, {
            type: this.incomingFile.mimeType,
          });

          // Create a browser download URL for the completed file
          const downloadUrl = URL.createObjectURL(fileBlob);

          const completedFile = {
            ...this.incomingFile,
            progress: 100,
            status: "completed",
            downloadUrl,
            blob: fileBlob,
          };

          this.onTransferUpdate(completedFile);
          this.incomingFile = null;
        }

        // 3. Peer cancelled the transfer
        else if (message.type === "file-cancel") {
          if (this.incomingFile && this.incomingFile.id === message.id) {
            this.onTransferUpdate({
              ...this.incomingFile,
              status: "cancelled",
            });
            this.incomingFile = null;
          }
        }

        // 4. Quick text chat / ping message
        else if (message.type === "chat") {
          this.onChatMessage(message);
        }
      } catch (err) {
        console.error("[WebRTC] Failed to parse control message:", err);
      }
      return;
    }

    // Binary message (ArrayBuffer) = a slice of the file currently being transferred
    if (data instanceof ArrayBuffer && this.incomingFile) {
      this.incomingFile.chunks.push(data);
      this.incomingFile.receivedBytes += data.byteLength;

      // Calculate progress percentage (0 - 100%)
      const progress = Math.min(
        100,
        Math.round((this.incomingFile.receivedBytes / this.incomingFile.size) * 100)
      );

      // Calculate live transfer speed (bytes per second) every 250ms
      const now = Date.now();
      const elapsed = (now - this.incomingFile.lastProgressTime) / 1000;
      if (elapsed >= 0.25 || progress === 100) {
        const bytesDelta = this.incomingFile.receivedBytes - this.incomingFile.lastReceivedBytes;
        this.incomingFile.speed = elapsed > 0 ? Math.round(bytesDelta / elapsed) : 0;
        this.incomingFile.lastProgressTime = now;
        this.incomingFile.lastReceivedBytes = this.incomingFile.receivedBytes;
      }

      this.incomingFile.progress = progress;

      // Notify UI of updated progress
      this.onTransferUpdate({ ...this.incomingFile });
    }
  }

  // ==========================================================================
  // 6. Sending File Logic (Sender Side with Flow Control)
  // ==========================================================================
  async sendFile(file, onProgressUpdate) {
    if (!this.dataChannel || this.dataChannel.readyState !== "open") {
      throw new Error("P2P connection is not ready. Please wait for peer to connect.");
    }

    this.isCancelled = false;
    const transferId = generateTransferId();

    const transferState = {
      id: transferId,
      name: file.name,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
      progress: 0,
      sentBytes: 0,
      speed: 0,
      direction: "outgoing",
      status: "transferring",
      startTime: Date.now(),
    };

    onProgressUpdate({ ...transferState });

    // Step 1: Send metadata header to the receiver
    this.dataChannel.send(
      JSON.stringify({
        type: "file-start",
        id: transferId,
        name: file.name,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
      })
    );

    let offset = 0;
    let lastProgressTime = Date.now();
    let lastSentBytes = 0;

    // Helper: wait for WebRTC buffer to drain before sending more chunks
    // This flow control prevents browser memory crashes on large files!
    const waitForBufferDrain = () => {
      return new Promise((resolve) => {
        if (this.dataChannel.bufferedAmount <= BUFFER_THRESHOLD) {
          resolve();
          return;
        }

        const handleBufferedAmountLow = () => {
          this.dataChannel.removeEventListener("bufferedamountlow", handleBufferedAmountLow);
          resolve();
        };

        this.dataChannel.addEventListener("bufferedamountlow", handleBufferedAmountLow);
      });
    };

    // Step 2: Slice file and send chunks one by one
    while (offset < file.size) {
      if (this.isCancelled) {
        this.dataChannel.send(
          JSON.stringify({
            type: "file-cancel",
            id: transferId,
          })
        );
        transferState.status = "cancelled";
        onProgressUpdate({ ...transferState });
        return;
      }

      // Read a chunk from the file
      const slice = file.slice(offset, offset + CHUNK_SIZE);
      const buffer = await slice.arrayBuffer();

      // Flow control: wait if channel buffer is full
      if (this.dataChannel.bufferedAmount > BUFFER_THRESHOLD) {
        await waitForBufferDrain();
      }

      // Send the binary slice directly over WebRTC
      this.dataChannel.send(buffer);
      offset += buffer.byteLength;
      transferState.sentBytes = offset;

      // Calculate progress percentage
      transferState.progress = Math.min(100, Math.round((offset / file.size) * 100));

      // Calculate transfer speed every 250ms
      const now = Date.now();
      const elapsed = (now - lastProgressTime) / 1000;
      if (elapsed >= 0.25 || transferState.progress === 100) {
        const bytesDelta = offset - lastSentBytes;
        transferState.speed = elapsed > 0 ? Math.round(bytesDelta / elapsed) : 0;
        lastProgressTime = now;
        lastSentBytes = offset;
      }

      onProgressUpdate({ ...transferState });
    }

    // Step 3: Send file completion signal
    this.dataChannel.send(
      JSON.stringify({
        type: "file-end",
        id: transferId,
      })
    );

    transferState.status = "completed";
    transferState.progress = 100;
    onProgressUpdate({ ...transferState });
  }

  // ==========================================================================
  // 7. Quick Chat / Ping Message
  // ==========================================================================
  sendChatMessage(text) {
    if (!this.dataChannel || this.dataChannel.readyState !== "open") {
      throw new Error("Data channel is not open.");
    }

    const payload = {
      type: "chat",
      id: generateTransferId(),
      text,
      timestamp: Date.now(),
      sender: "peer",
    };

    this.dataChannel.send(JSON.stringify(payload));
    return { ...payload, sender: "me" };
  }

  // Cancel any active file transfer
  cancelTransfer() {
    this.isCancelled = true;
  }

  // Cleanup WebRTC connections
  cleanupConnection() {
    if (this.dataChannel) {
      try {
        this.dataChannel.close();
      } catch (e) {}
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      try {
        this.peerConnection.close();
      } catch (e) {}
      this.peerConnection = null;
    }

    this.iceCandidatesQueue = [];
    this.incomingFile = null;
  }

  // Destroy everything when leaving room
  destroy() {
    this.cleanupConnection();

    // Remove socket listeners
    this.socket.off("peer-joined");
    this.socket.off("signal:offer");
    this.socket.off("signal:answer");
    this.socket.off("signal:ice-candidate");
    this.socket.off("peer-left");
  }
}
