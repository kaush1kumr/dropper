// ============================================================================
// Lobby Screen Component
// ============================================================================
// Welcome screen for Dropper:
// - Allows user to create a new transfer room with a generated code
// - Allows user to join an existing room by code or pasted link
// - Verifies signaling server connection health
// - Clearly explains how peer-to-peer file sharing works
// ============================================================================

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap,
  ArrowRight,
  PlusCircle,
  LogIn,
  ShieldCheck,
  Infinity as InfinityIcon,
  Laptop,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { generateRoomCode } from "../utils/fileTransfer";
import { SIGNALING_SERVER_URL } from "../utils/constants";

const Lobby = () => {
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [serverOnline, setServerOnline] = useState(true);
  const navigate = useNavigate();

  // Test signaling server health on mount
  useEffect(() => {
    let isMounted = true;
    fetch(`${SIGNALING_SERVER_URL}/health`)
      .then((res) => {
        if (isMounted) setServerOnline(res.ok);
      })
      .catch(() => {
        if (isMounted) setServerOnline(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Create a new room with an instant random code
  const handleCreateRoom = () => {
    const newCode = generateRoomCode();
    navigate(`/room/${newCode}`);
  };

  // Join an existing room
  const handleJoinRoom = (e) => {
    e.preventDefault();

    if (!roomCode.trim()) {
      setError("Please enter a room code or invite link.");
      return;
    }

    let cleanCode = roomCode.trim();

    // If user pasted a full URL (e.g., http://localhost:3000/room/DROP-1234), extract code
    if (cleanCode.includes("/room/")) {
      cleanCode = cleanCode.split("/room/")[1].split("?")[0].split("#")[0];
    }

    cleanCode = cleanCode.toUpperCase();

    if (!cleanCode) {
      setError("Invalid room code.");
      return;
    }

    navigate(`/room/${cleanCode}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar serverOnline={serverOnline} />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col justify-center">
        
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wide uppercase shadow-sm">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>WebRTC Direct Transfer</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent leading-[1.15]">
            Share files directly. <br />
            <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
              No servers attached.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl mx-auto">
            Send files directly between two devices using WebRTC. High speed, end-to-end
            encrypted, and zero file size limits.
          </p>

          {!serverOnline && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 max-w-md mx-auto text-center">
              Signaling server is not responding at <code className="font-mono text-rose-200">{SIGNALING_SERVER_URL}</code>.
              Ensure the backend server is running (<code className="font-mono">node server/index.js</code>).
            </div>
          )}
        </div>

        {/* Action Cards (Create Room & Join Room) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto w-full">
          
          {/* Card 1: Create Room */}
          <div className="glass-panel glass-panel-hover rounded-2xl p-6 sm:p-8 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-105 group-hover:bg-indigo-500/20 transition-all duration-200">
                <PlusCircle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-100">Create a Room</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Start a private transfer session. We'll generate a code and direct link you can share with your recipient.
              </p>
            </div>

            <div className="pt-6">
              <button
                onClick={handleCreateRoom}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 active:scale-[0.99] cursor-pointer"
              >
                <span>Create Transfer Room</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 2: Join Room */}
          <div className="glass-panel glass-panel-hover rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-300 border border-slate-700/60 flex items-center justify-center">
                <LogIn className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-100">Join a Room</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Have a code or invite link from someone? Enter it below to connect directly with their browser.
              </p>
            </div>

            <form onSubmit={handleJoinRoom} className="pt-6 space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="e.g. DROP-8K2A or paste link"
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value);
                    if (error) setError("");
                  }}
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700/80 focus:border-indigo-500 rounded-xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none uppercase tracking-wider font-mono transition-colors"
                />
                {error && <p className="text-xs text-rose-400 mt-1.5">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={!roomCode.trim()}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-100 text-sm font-semibold transition-all border border-slate-700/80 cursor-pointer active:scale-[0.99]"
              >
                <span>Join Room</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

        {/* How It Works 3-Step Guide */}
        <div className="max-w-3xl mx-auto w-full mt-14 pt-10 border-t border-slate-900/80">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center mb-6">
            How Dropper Works in 3 Simple Steps
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 text-center">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold text-xs flex items-center justify-center mx-auto mb-2.5">
                1
              </div>
              <h4 className="text-sm font-semibold text-slate-200">Create or Join</h4>
              <p className="text-xs text-slate-400 mt-1">
                Open a room and share the room code or invite link with your friend.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 text-center">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 font-bold text-xs flex items-center justify-center mx-auto mb-2.5">
                2
              </div>
              <h4 className="text-sm font-semibold text-slate-200">Direct Handshake</h4>
              <p className="text-xs text-slate-400 mt-1">
                WebRTC opens an encrypted DataChannel directly between your browsers.
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 text-center">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center mx-auto mb-2.5">
                3
              </div>
              <h4 className="text-sm font-semibold text-slate-200">Stream Files</h4>
              <p className="text-xs text-slate-400 mt-1">
                Drop any file to stream it instantly without size limits or server storage.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto w-full mt-10 pt-8 border-t border-slate-900">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200">100% Private</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Files are transferred directly device-to-device with DTLS encryption. Nothing touches a server.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0">
              <InfinityIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200">No Size Limits</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Stream 4K videos, massive archives, or entire albums without arbitrary file caps.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Universal Support</h4>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Works across Chrome, Safari, Firefox, Edge, and iOS/Android mobile browsers.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/80 py-6 text-center text-xs text-slate-400">
        <p>Dropper • Direct Peer-to-Peer File Sharing powered by WebRTC</p>
      </footer>
    </div>
  );
};

export default Lobby;