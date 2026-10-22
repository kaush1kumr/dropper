// ============================================================================
// FileCard Component
// ============================================================================
// Displays an individual file transfer card:
// - Shows file icon, name, formatted size, and transfer direction
// - Live progress bar with transfer speed
// - Direct download button for received files
// ============================================================================

import React from "react";
import {
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code,
  File,
  Download,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
} from "lucide-react";
import { formatBytes, formatSpeed, getFileExtension } from "../utils/fileTransfer";

/**
 * Return an appropriate Lucide icon based on MIME type or extension
 */
function getFileIcon(mimeType = "", fileName = "") {
  const ext = getFileExtension(fileName).toLowerCase();

  if (mimeType.startsWith("image/") || ["png", "jpg", "jpeg", "svg", "webp", "gif"].includes(ext)) {
    return <Image className="w-5 h-5 text-purple-400" />;
  }
  if (mimeType.startsWith("video/") || ["mp4", "mkv", "mov", "webm", "avi"].includes(ext)) {
    return <Video className="w-5 h-5 text-rose-400" />;
  }
  if (mimeType.startsWith("audio/") || ["mp3", "wav", "flac", "ogg", "aac"].includes(ext)) {
    return <Music className="w-5 h-5 text-emerald-400" />;
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return <Archive className="w-5 h-5 text-amber-400" />;
  }
  if (["js", "jsx", "ts", "tsx", "html", "css", "py", "json", "c", "cpp", "rs", "go"].includes(ext)) {
    return <Code className="w-5 h-5 text-sky-400" />;
  }
  if (["pdf", "doc", "docx", "txt", "md"].includes(ext)) {
    return <FileText className="w-5 h-5 text-blue-400" />;
  }
  return <File className="w-5 h-5 text-indigo-400" />;
}

const FileCard = ({ transfer, onCancel }) => {
  const isIncoming = transfer.direction === "incoming";
  const isCompleted = transfer.status === "completed";
  const isCancelled = transfer.status === "cancelled";
  const isFailed = transfer.status === "failed";
  const isTransferring = transfer.status === "transferring";

  return (
    <div className="glass-panel glass-panel-hover rounded-xl p-4 transition-all duration-200">
      
      {/* Top row: File Info and Action / Status */}
      <div className="flex items-start justify-between gap-3">
        
        {/* Left: File icon + Name & Size */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-slate-800/90 border border-slate-700/60 flex items-center justify-center shrink-0 shadow-sm">
            {getFileIcon(transfer.mimeType, transfer.name)}
          </div>
          <div className="min-w-0">
            <h4
              className="text-sm font-semibold text-slate-100 truncate"
              title={transfer.name}
            >
              {transfer.name}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
              <span className="font-mono">{formatBytes(transfer.size)}</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-medium">
                {isIncoming ? (
                  <>
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Incoming</span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-indigo-400">Outgoing</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions / Status */}
        <div className="flex items-center gap-2 shrink-0">
          {isCompleted && isIncoming && transfer.downloadUrl && (
            <a
              href={transfer.downloadUrl}
              download={transfer.name}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm shadow-indigo-600/20 cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save File</span>
            </a>
          )}

          {isCompleted && !isIncoming && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sent</span>
            </span>
          )}

          {isCancelled && (
            <span className="flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancelled</span>
            </span>
          )}

          {isFailed && (
            <span className="flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Failed</span>
            </span>
          )}

          {isTransferring && onCancel && (
            <button
              onClick={() => onCancel(transfer.id)}
              className="text-xs text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer"
              title="Cancel transfer"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>

      {/* Progress Bar & Speed (visible while transferring) */}
      {isTransferring && (
        <div className="mt-3.5 space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400">
            <span>
              {isIncoming ? "Receiving" : "Sending"}...{" "}
              <strong className="text-slate-200 font-mono font-medium">
                {formatSpeed(transfer.speed)}
              </strong>
            </span>
            <span className="font-semibold text-indigo-300 font-mono">
              {transfer.progress}%
            </span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-150"
              style={{ width: `${transfer.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Finished Success Banner for Incoming Files */}
      {isCompleted && isIncoming && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Transfer complete
          </span>
          <span>Click "Save File" to download to your device</span>
        </div>
      )}

    </div>
  );
};

export default FileCard;
