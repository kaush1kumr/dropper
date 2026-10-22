// ============================================================================
// Room Screen Component
// ============================================================================
// The main active peer-to-peer file sharing room:
// - Joins the signaling room with the specified room code
// - Tracks signaling server & WebRTC peer connection states
// - Provides drag-and-drop file sharing with queueing
// - Displays live transfer cards and progress
// - Quick WebRTC chat between connected peers
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Copy,
  Check,
  Share2,
  Users,
  ShieldCheck,
  Zap,
  HardDrive,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Info,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Dropzone from "../components/Dropzone";
import TransferList from "../components/TransferList";
import QuickChat from "../components/QuickChat";
import { getSocket } from "../services/socket";
import { WebRTCManager } from "../services/webrtc";
import { SIGNALING_SERVER_URL } from "../utils/constants";

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const normalizedRoomId = (roomId || "").toUpperCase().trim();

  // State
  const [connectionStatus, setConnectionStatus] = useState("connecting_server"); // 'connecting_server' | 'waiting' | 'connecting' | 'connected' | 'failed'
  const [statusMessage, setStatusMessage] = useState("Connecting to signaling server...");
  const [serverOnline, setServerOnline] = useState(true);
  const [isRoomFull, setIsRoomFull] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [transfers, setTransfers] = useState({});
  const [chatMessages, setChatMessages] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [toast, setToast] = useState(null); // { message, type: 'warning' | 'info' | 'success' }

  // References
  const webrtcRef = useRef(null);
  const socketRef = useRef(null);
  const fileQueueRef = useRef([]);

  // Toast notification helper
  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // --------------------------------------------------------------------------
  // Update transfer state helper
  // --------------------------------------------------------------------------
  const updateTransfer = useCallback((fileData) => {
    setTransfers((prev) => ({
      ...prev,
      [fileData.id]: {
        ...(prev[fileData.id] || {}),
        ...fileData,
      },
    }));
  }, []);

  // --------------------------------------------------------------------------
  // Setup Socket & WebRTC on component mount
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!normalizedRoomId) {
      navigate("/");
      return;
    }

    const socket = getSocket();
    socketRef.current = socket;

    // Create WebRTC manager instance
    const webrtc = new WebRTCManager({
      socket,
      roomId: normalizedRoomId,
      onStatusChange: (status, message) => {
        setConnectionStatus(status);
        setStatusMessage(message);
      },
      onTransferUpdate: (fileData) => {
        updateTransfer(fileData);
      },
      onChatMessage: (message) => {
        setChatMessages((prev) => [...prev, message]);
      },
    });

    webrtcRef.current = webrtc;

    // Socket lifecycle handlers
    const handleConnect = () => {
      console.log(`[Room] Connected to signaling server`);
      setServerOnline(true);
      socket.emit("join-room", { roomId: normalizedRoomId });
    };

    const handleConnectError = (err) => {
      console.warn(`[Room] Signaling server connection error:`, err?.message);
      setServerOnline(false);
      setConnectionStatus("connecting_server");
      setStatusMessage(`Unable to connect to signaling server at ${SIGNALING_SERVER_URL}. Reconnecting...`);
    };

    const handleDisconnect = () => {
      console.log(`[Room] Disconnected from signaling server`);
      setServerOnline(false);
      setConnectionStatus("connecting_server");
      setStatusMessage("Disconnected from signaling server. Trying to reconnect...");
    };

    // Socket response handlers
    const handleRoomJoined = ({ isInitiator, peerPresent }) => {
      console.log(`[Room] Joined ${normalizedRoomId}. Peer present: ${peerPresent}`);
      setServerOnline(true);
      if (peerPresent) {
        setConnectionStatus("connecting");
        setStatusMessage("Peer detected! Establishing direct WebRTC connection...");
      } else {
        setConnectionStatus("waiting");
        setStatusMessage("Waiting for peer to join room...");
      }
    };

    const handleRoomFull = () => {
      setIsRoomFull(true);
      setConnectionStatus("failed");
      setStatusMessage("Room is already full (maximum 2 peers).");
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);
    socket.on("room-joined", handleRoomJoined);
    socket.on("room-full", handleRoomFull);

    // Initial check: if already connected, emit join-room immediately
    if (socket.connected) {
      setServerOnline(true);
      socket.emit("join-room", { roomId: normalizedRoomId });
    } else {
      setServerOnline(false);
      setConnectionStatus("connecting_server");
      setStatusMessage("Connecting to signaling server...");
    }

    // Cleanup when leaving room or unmounting
    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
      socket.off("room-joined", handleRoomJoined);
      socket.off("room-full", handleRoomFull);
      if (webrtcRef.current) {
        webrtcRef.current.destroy();
        webrtcRef.current = null;
      }
      socket.emit("leave-room");
    };
  }, [normalizedRoomId, navigate, updateTransfer]);

  // --------------------------------------------------------------------------
  // Send Files (Processes files sequentially)
  // --------------------------------------------------------------------------
  const processNextInQueue = useCallback(async () => {
    if (fileQueueRef.current.length === 0 || !webrtcRef.current) {
      setIsSending(false);
      return;
    }

    setIsSending(true);
    const file = fileQueueRef.current.shift();

    try {
      await webrtcRef.current.sendFile(file, (progressData) => {
        updateTransfer(progressData);
      });
    } catch (err) {
      console.error("[Room] Error sending file:", err);
      showToast(`Transfer failed: ${err.message}`, "warning");
    } finally {
      // Process next file in queue if any
      processNextInQueue();
    }
  }, [updateTransfer, showToast]);

  const handleFilesSelected = (files) => {
    if (connectionStatus !== "connected") {
      showToast("Please wait until a peer connects before sending files.", "warning");
      return;
    }

    if (!files || files.length === 0) return;

    // Add selected files to queue
    fileQueueRef.current.push(...files);
    showToast(`Added ${files.length} file(s) to transfer queue`, "info");

    // Start sending if not already transmitting
    if (!isSending) {
      processNextInQueue();
    }
  };

  // --------------------------------------------------------------------------
  // Cancel active transfer
  // --------------------------------------------------------------------------
  const handleCancelTransfer = (transferId) => {
    if (webrtcRef.current) {
      webrtcRef.current.cancelTransfer();
    }
    setTransfers((prev) => {
      if (!prev[transferId]) return prev;
      return {
        ...prev,
        [transferId]: {
          ...prev[transferId],
          status: "cancelled",
        },
      };
    });
    setIsSending(false);
    showToast("File transfer cancelled", "info");
  };

  // --------------------------------------------------------------------------
  // Clear finished transfers
  // --------------------------------------------------------------------------
  const handleClearCompleted = () => {
    setTransfers((prev) => {
      const activeOnly = {};
      Object.entries(prev).forEach(([id, item]) => {
        if (item.status === "transferring") {
          activeOnly[id] = item;
        }
      });
      return activeOnly;
    });
  };

  // --------------------------------------------------------------------------
  // Send Quick Chat Message
  // --------------------------------------------------------------------------
  const handleSendMessage = (text) => {
    if (!webrtcRef.current) return;
    try {
      const myMessage = webrtcRef.current.sendChatMessage(text);
      setChatMessages((prev) => [...prev, myMessage]);
    } catch (err) {
      console.error("[Room] Error sending chat:", err);
      showToast("Could not send message. Peer data channel is not open.", "warning");
    }
  };

  // --------------------------------------------------------------------------
  // Copy Helpers (Room Code & Direct Invite Link)
  // --------------------------------------------------------------------------
  const copyRoomCode = () => {
    navigator.clipboard.writeText(normalizedRoomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    showToast(`Copied room code: ${normalizedRoomId}`, "success");
  };

  const copyInviteLink = async () => {
    const inviteUrl = `${window.location.origin}/room/${normalizedRoomId}`;
    
    // Try native share API on mobile if supported
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Dropper P2P File Transfer",
          text: `Join room ${normalizedRoomId} on Dropper to share files directly!`,
          url: inviteUrl,
        });
        return;
      } catch (err) {
        // Fall back to clipboard if share was dismissed or unsupported
      }
    }

    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    showToast("Invite link copied to clipboard!", "success");
  };

  const handleLeaveRoom = () => {
    navigate("/");
  };

  // --------------------------------------------------------------------------
  // If Room is Full
  // --------------------------------------------------------------------------
  if (isRoomFull) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar status="failed" onLeaveRoom={handleLeaveRoom} showLeaveButton serverOnline={serverOnline} />
        <main className="flex-1 max-w-md mx-auto px-4 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">Room is Full</h2>
          <p className="text-sm text-slate-400 mb-6">
            Room <strong className="text-slate-200">{normalizedRoomId}</strong> already has 2
            connected peers. Peer-to-peer file sharing is 1-to-1.
          </p>
          <button
            onClick={handleLeaveRoom}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-lg shadow-indigo-600/20"
          >
            Back to Lobby
          </button>
        </main>
      </div>
    );
  }

  const isConnected = connectionStatus === "connected";

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-bounce transition-all">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-semibold shadow-xl backdrop-blur-md ${
              toast.type === "warning"
                ? "bg-amber-950/80 border-amber-500/50 text-amber-200"
                : toast.type === "success"
                ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-200"
                : "bg-slate-900/90 border-slate-700 text-slate-200"
            }`}
          >
            {toast.type === "warning" ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : toast.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        status={connectionStatus}
        statusMessage={statusMessage}
        onLeaveRoom={handleLeaveRoom}
        showLeaveButton
        serverOnline={serverOnline}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        
        {/* Room Header & Share Bar */}
        <div className="glass-panel rounded-2xl p-5 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Room Code Badge */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Current Transfer Room
              </span>
              <div className="flex items-center gap-3">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-wider bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent font-mono">
                  {normalizedRoomId}
                </span>
                <button
                  onClick={copyRoomCode}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors cursor-pointer"
                  title="Copy room code"
                >
                  {copiedCode ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Quick Share Link Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={copyInviteLink}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 cursor-pointer active:scale-[0.98]"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-indigo-200" />
                    <span>Share Invite Link</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Connection Status Banner */}
          <div className="mt-5 pt-4 border-t border-slate-800/80">
            {isConnected ? (
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-emerald-400 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Connected to peer! You can now send and receive files directly.</span>
              </div>
            ) : connectionStatus === "connecting" ? (
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-sky-400 font-medium">
                <RefreshCw className="w-4 h-4 animate-spin text-sky-400 shrink-0" />
                <span>Peer detected! Establishing encrypted WebRTC DataChannel connection...</span>
              </div>
            ) : !serverOnline ? (
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-rose-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Signaling server is offline. Please make sure the server is running on <code className="font-mono text-rose-300">port 5000</code>.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-amber-400">
                <Users className="w-4 h-4 animate-bounce shrink-0" />
                <span>
                  Waiting for recipient. Share this code or invite link to connect devices.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Drag-and-Drop Area */}
        <Dropzone
          onFilesSelected={handleFilesSelected}
          isConnected={isConnected}
          isSending={isSending}
        />

        {/* Active & Finished Transfers */}
        <TransferList
          transfers={transfers}
          onCancelTransfer={handleCancelTransfer}
          onClearCompleted={handleClearCompleted}
        />

        {/* Peer Quick Chat / Test connection */}
        <QuickChat
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          isConnected={isConnected}
        />

        {/* Info Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs text-slate-400">
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 flex items-start gap-3">
            <Zap className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block">Direct Peer-to-Peer</span>
              <span>Files flow straight from your browser to your peer's browser.</span>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block">Encrypted & Private</span>
              <span>WebRTC uses native DTLS encryption for full data privacy.</span>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 flex items-start gap-3">
            <HardDrive className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block">No Storage Limits</span>
              <span>Send files of any size without server upload limits or waiting.</span>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/80 py-6 text-center text-xs text-slate-400">
        <p>Dropper • Direct browser-to-browser P2P file sharing with WebRTC</p>
      </footer>

    </div>
  );
};

export default Room;
