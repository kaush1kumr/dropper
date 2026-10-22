// ============================================================================
// File Transfer Utilities
// ============================================================================
// Helper functions for formatting bytes, speeds, IDs, and file extensions.
// Clean, pure functions that are easy to test and read.
// ============================================================================

/**
 * Format raw bytes into human-readable strings (e.g., "15.4 MB")
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Precision (default: 2)
 * @returns {string} Formatted size string
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  if (!bytes || isNaN(bytes)) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const unitIndex = Math.min(i, sizes.length - 1);

  return parseFloat((bytes / Math.pow(k, unitIndex)).toFixed(dm)) + " " + sizes[unitIndex];
}

/**
 * Format bytes per second into speed (e.g., "3.2 MB/s")
 * @param {number} bytesPerSec - Speed in bytes/sec
 * @returns {string} Formatted speed string
 */
export function formatSpeed(bytesPerSec) {
  if (!bytesPerSec || bytesPerSec <= 0) return "0 KB/s";
  return `${formatBytes(bytesPerSec, 1)}/s`;
}

/**
 * Generate a clean, random 6-character room code (e.g., "DROP-89F2")
 * @returns {string} Room code
 */
export function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Omitted confusing characters like I, O, 0, 1
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `DROP-${code}`;
}

/**
 * Generate a unique ID for each file transfer
 * @returns {string} Unique identifier
 */
export function generateTransferId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Extract file extension for display
 * @param {string} fileName - File name with extension
 * @returns {string} Uppercase extension (e.g., "PDF", "ZIP", "PNG")
 */
export function getFileExtension(fileName) {
  if (!fileName || !fileName.includes(".")) return "FILE";
  return fileName.split(".").pop().toUpperCase();
}
