// ============================================================================
// TransferList Component
// ============================================================================
// Displays the list of current and past file transfers.
// Allows users to clear completed history or cancel active transfers.
// ============================================================================

import React from "react";
import { FolderSync, Trash2 } from "lucide-react";
import FileCard from "./FileCard";

const TransferList = ({ transfers, onCancelTransfer, onClearCompleted }) => {
  const transferEntries = Object.values(transfers || {});

  if (transferEntries.length === 0) {
    return null;
  }

  // Count how many are completed/cancelled vs active
  const hasCompleted = transferEntries.some(
    (t) => t.status === "completed" || t.status === "cancelled" || t.status === "failed"
  );

  return (
    <div className="space-y-3.5">
      
      {/* Header bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <FolderSync className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-100">
            Transfers
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] font-semibold text-slate-300 font-mono">
            {transferEntries.length}
          </span>
        </div>

        {hasCompleted && (
          <button
            onClick={onClearCompleted}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-transparent hover:border-slate-700 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Finished</span>
          </button>
        )}
      </div>

      {/* Cards list */}
      <div className="space-y-2.5">
        {transferEntries
          .slice()
          .reverse() // Latest transfers first
          .map((transfer) => (
            <FileCard
              key={transfer.id}
              transfer={transfer}
              onCancel={onCancelTransfer}
            />
          ))}
      </div>

    </div>
  );
};

export default TransferList;
