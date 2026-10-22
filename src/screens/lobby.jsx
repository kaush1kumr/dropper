import React, {useState, useCallback} from "react";
import './styles.css';

const Lobby = () => {
  const [roomCode, setRoomCode] = useState('');

  const createButton = useCallback(() => {
    // Logic to create a new room
    console.log("Create Room button clicked");
  }, []);

  const joinButton = useCallback(() => {
    // Logic to join an existing room using the roomCode
    console.log(`Join Room button clicked with code: ${roomCode}`);
  }, [roomCode]);

  return (
    <div className="lobby-container">
      <h1>Welcome to the Lobby</h1>

      <div className="lobby-actions">
        <button onClick={createButton}>Create Room</button>
        <br />

        <input 
          type="text" 
          placeholder="Room Code" 
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
        />
        <button onClick={joinButton}>Join Room</button>
      </div>

    </div>
  );
};

export default Lobby;