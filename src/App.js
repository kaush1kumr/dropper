// ============================================================================
// Main Application Router
// ============================================================================
// Configures client-side routes for the Dropper application:
// - "/"              : Lobby screen (create or join room)
// - "/room/:roomId"  : Active transfer room
// ============================================================================

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Lobby from "./screens/lobby";
import Room from "./screens/Room";
import "./App.css";

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Routes>
        {/* Welcome Lobby */}
        <Route path="/" element={<Lobby />} />

        {/* Active Transfer Room */}
        <Route path="/room/:roomId" element={<Room />} />

        {/* Fallback to Lobby */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
