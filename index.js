import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid'; // Import UUID v4 generator

const wss = new WebSocketServer({ port: 8080 }); // Create WebSocket server on port 8080

// Object to track connected clients and channels
const clients = new Map(); // Maps clientId to WebSocket connection
const channels = {}; // Maps channel name to an array of clients in that channel

// When a new client connects
wss.on('connection', (ws) => {
  let clientId = uuidv4() // Simple client ID for demonstration
  let currentChannel = null;

  clients.set(clientId, ws); // Store the WebSocket connection
  console.log(`New client connected with ID: ${clientId}`);

  // When the server receives a message from a client
  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'join-channel') {
      // When a client joins a channel
      currentChannel = data.channel;

      // If the channel doesn't exist yet, create it
      if (!channels[currentChannel]) {
        channels[currentChannel] = [];
      }

      // Add the client to the channel
      channels[currentChannel].push(ws);
      console.log(`Client ${clientId} joined channel: ${currentChannel}`);

      // Optionally, you can send a confirmation back to the client
      ws.send(JSON.stringify({ type: 'joined-channel', channel: currentChannel }));

    } else {
      // Forward the message to other clients in the same channel (except the sender)
      if (currentChannel) {
        channels[currentChannel]
          .filter((member) => member !== ws) // Exclude the sender (ws)
          .forEach((member) => {
            member.send(message.toString()); // Send the message to other members
          });
      }
    }
  });

  // When a client disconnects
  ws.on('close', () => {
    clients.delete(clientId); // Remove client from the map

    // Remove the client from the channel
    if (currentChannel && channels[currentChannel]) {
      channels[currentChannel] = channels[currentChannel].filter((member) => member !== ws);
      console.log(`Client ${clientId} disconnected from channel ${currentChannel}`);
      
      // If the channel is empty, delete it
      if (channels[currentChannel].length === 0) {
        delete channels[currentChannel];
        console.log(`Channel ${currentChannel} is now empty and removed`);
      }
    }
    
    console.log(`Client ${clientId} disconnected`);
  });

  // When there's an error in the connection
  ws.on('error', (err) => {
    console.error(`Error with client ${clientId}:`, err);
  });

  // Send a welcome message to the client
  ws.send(JSON.stringify({ type: 'connection-established', message: 'Welcome to the signaling server' }));
});

console.log('Signaling server running on ws://localhost:8080');