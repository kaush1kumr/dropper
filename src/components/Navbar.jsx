// ============================================================================
// Navbar Component
// ============================================================================
// Displays application branding and live peer / server connection status.
// ============================================================================

import React from "react";
import { Link } from "react-router-dom";
import { Zap, Wifi, WifiOff, Users, ArrowLeft, AlertTriangle, RefreshCw } from "lucide-react";

const Navbar = ({
  status,
  statusMessage,
  onLeaveRoom,
  showLeaveButton = false,
  serverOnline = true,
}) => {
  // Determine badge styling based on connection state
  const getStatusBadge = () => {
    if (!serverOnline) {
      return {
        bg: "bg-rose-500/10 border-rose-500/30 text-rose-300",
        dot: "bg-rose-400",
        text: "Server Offline",
        icon: <WifiOff className="w-3.5 h-3.5 text-rose-400" />,
      };
    }

    switch (status) {
      case "connected":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
          dot: "bg-emerald-400 animate-pulse",
          text: "Peer Connected",
          icon: <Wifi className="w-3.5 h-3.5 text-emerald-400" />,
        };
      case "connecting":
        return {
          bg: "bg-sky-500/10 border-sky-500/30 text-sky-300",
          dot: "bg-sky-400 animate-ping",
          text: "Connecting P2P...",
          icon: <RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />,
        };
      case "waiting":
        return {
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-300",
          dot: "bg-amber-400 animate-pulse",
          text: "Waiting for Peer",
          icon: <Users className="w-3.5 h-3.5 text-amber-400" />,
        };
      case "connecting_server":
        return {
          bg: "bg-violet-500/10 border-violet-500/30 text-violet-300",
          dot: "bg-violet-400 animate-pulse",
          text: "Connecting Server...",
          icon: <RefreshCw className="w-3.5 h-3.5 text-violet-400 animate-spin" />,
        };
      case "failed":
        return {
          bg: "bg-rose-500/10 border-rose-500/30 text-rose-300",
          dot: "bg-rose-500",
          text: "Connection Failed",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />,
        };
      default:
        return {
          bg: "bg-slate-800/80 border-slate-700/80 text-slate-300",
          dot: "bg-emerald-400",
          text: "Server Ready",
          icon: <Wifi className="w-3.5 h-3.5 text-slate-400" />,
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 group-hover:shadow-indigo-500/30 transition-all duration-200">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                Dropper
              </span>
              <span className="ml-2.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 tracking-wide uppercase">
                P2P
              </span>
            </div>
          </Link>
        </div>

        {/* Right: Status indicator & Leave Button */}
        <div className="flex items-center gap-3">
          {status && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-sm transition-all duration-200 cursor-default shadow-sm ${badge.bg}`}
              title={statusMessage || badge.text}
            >
              <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
              <span className="flex items-center gap-1.5 font-medium">
                {badge.icon}
                <span className="hidden sm:inline">{badge.text}</span>
              </span>
            </div>
          )}

          {showLeaveButton && (
            <button
              onClick={onLeaveRoom}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded-xl transition-all duration-150 cursor-pointer shadow-sm hover:border-slate-600"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Leave Room</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};

export default Navbar;
