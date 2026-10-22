// ============================================================================
// Dropzone Component
// ============================================================================
// Drag-and-drop file dropzone with native file input selector.
// Automatically detects drag-and-drop events and handles multiple files.
// ============================================================================

import React, { useState, useRef } from "react";
import { UploadCloud, FileUp, ShieldCheck, Zap, HardDrive } from "lucide-react";

const Dropzone = ({ onFilesSelected, isConnected, isSending }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Drag-and-drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isConnected || isSending) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!isConnected || isSending) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFilesSelected(filesArray);
    }
  };

  // Click to browse files handler
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesSelected(filesArray);
      // Reset input value so user can select the same file again if desired
      e.target.value = "";
    }
  };

  const handleClickBrowse = () => {
    if (!isConnected || isSending) return;
    fileInputRef.current?.click();
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClickBrowse}
      className={`relative w-full rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 select-none ${
        !isConnected
          ? "border-slate-800 bg-slate-900/30 opacity-70 cursor-not-allowed"
          : isSending
          ? "border-indigo-500/50 bg-indigo-950/10 cursor-wait"
          : isDragging
          ? "border-indigo-400 bg-indigo-500/10 scale-[1.01] shadow-2xl shadow-indigo-500/20 cursor-copy"
          : "border-slate-700/80 hover:border-indigo-500/60 bg-slate-900/50 hover:bg-slate-900/80 cursor-pointer hover:shadow-xl hover:shadow-indigo-500/10"
      }`}
    >
      {/* Hidden native file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        className="hidden"
        disabled={!isConnected || isSending}
      />

      <div className="flex flex-col items-center justify-center space-y-4">
        
        {/* Animated Icon Circle */}
        <div
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center transition-all duration-200 ${
            isDragging
              ? "bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-500/30"
              : isConnected
              ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-105"
              : "bg-slate-900 text-slate-500 border border-slate-800"
          }`}
        >
          {isDragging ? (
            <FileUp className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
          ) : (
            <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10" />
          )}
        </div>

        {/* Text Instructions */}
        <div className="space-y-1.5 max-w-md">
          <h3 className="text-lg sm:text-xl font-bold text-slate-100">
            {isDragging
              ? "Drop files here to send"
              : !isConnected
              ? "Waiting for peer to connect..."
              : isSending
              ? "Streaming file in progress..."
              : "Drag & drop files here, or browse"}
          </h3>

          <p className="text-sm text-slate-400">
            {!isConnected
              ? "Connect with recipient first. Direct transfer will unlock immediately."
              : isSending
              ? "Please wait while the active transfer finishes."
              : "Any file type • Zero size limit • End-to-end encrypted"}
          </p>
        </div>

        {/* Action Button / Badges */}
        {isConnected && !isSending && (
          <div className="pt-2">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40">
              <FileUp className="w-4 h-4" />
              <span>Choose Files to Send</span>
            </span>
          </div>
        )}

        {/* Security / Feature tags */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 border-t border-slate-800/60 w-full max-w-sm">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            End-to-End Encrypted
          </span>
          <span className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-sky-400" />
            No Size Limits
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Direct P2P
          </span>
        </div>

      </div>
    </div>
  );
};

export default Dropzone;
