// ============================================================================
// QuickChat Component
// ============================================================================
// Allows connected peers to exchange instant text messages and test
// the WebRTC DataChannel connection in real time.
// ============================================================================

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

const QuickChat = ({ messages, onSendMessage, isConnected }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll chat to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !isConnected) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const handleQuickPreset = (text) => {
    if (!isConnected) return;
    onSendMessage(text);
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden transition-all duration-200 shadow-md">
      
      {/* Toggle Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-bold text-slate-200">
            Direct Peer Chat
          </span>
          {messages.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold font-mono">
              {messages.length}
            </span>
          )}
          {messages.length > 0 && !isOpen && (
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          )}
          {!isConnected && (
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              (Requires connected peer)
            </span>
          )}
        </div>
        <div className="text-slate-400">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Chat Body */}
      {isOpen && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 space-y-3">
          
          {/* Quick presets when connected */}
          {isConnected && messages.length === 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Quick greetings:
              </span>
              {["👋 Hey there!", "📁 Ready to receive!", "⚡ Direct P2P test"].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleQuickPreset(preset)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-indigo-600/30 border border-slate-700/80 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          )}

          {/* Messages list */}
          <div className="h-48 overflow-y-auto space-y-2 pr-1">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 text-center px-4">
                <p>Send a quick message to test the direct WebRTC DataChannel connection!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender === "me";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs font-normal leading-relaxed ${
                        isMe
                          ? "bg-indigo-600 text-white rounded-br-none shadow-sm shadow-indigo-600/20"
                          : "bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/70"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 px-1 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder={isConnected ? "Type a direct peer message..." : "Connect to a peer to chat..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={!isConnected}
              className="flex-1 px-4 py-2.5 text-xs bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50 transition-colors"
            />
            <button
              type="submit"
              disabled={!isConnected || !inputText.trim()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/20 active:scale-95"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      )}

    </div>
  );
};

export default QuickChat;
