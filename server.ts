import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { User, SignalingMessage, CallSession } from './types';
import dotenv from 'dotenv';
import queueRoutes from './routes/queueRoutes';
import { connectDB } from './config/db';
import { matchmakingQueue } from './singletons/queue';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware - CORS for production (allow all origins for ngrok + Render)
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? true : true, // Allow all for now
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/queue', queueRoutes);

// Store active users and call sessions
const users = new Map<string, User>();
const callSessions = new Map<string, CallSession>();

// Generate unique user ID
function generateUserId(): string {
  return uuidv4();
}

// Handle WebSocket connections
wss.on('connection', (ws: WebSocket) => {
  const userId = generateUserId();
  
  // Add user to active users
  users.set(userId, {
    id: userId,
    socket: ws,
    isInCall: false
  });

  console.log(`User ${userId} connected. Total users: ${users.size}`);

  // Send user ID to client
  ws.send(JSON.stringify({
    type: 'user-id',
    userId: userId
  }));

  // Handle incoming messages
  ws.on('message', (data: string) => {
    try {
      const message: SignalingMessage = JSON.parse(data);
      handleMessage(userId, message);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    handleUserDisconnect(userId);
  });
});

// Handle different message types
function handleMessage(userId: string, message: SignalingMessage) {
  const user = users.get(userId);
  if (!user) return;

  switch (message.type) {
    case 'join-queue':
      handleJoinQueue(userId, message.data);
      break;
    case 'leave-queue':
      handleLeaveQueue(userId);
      break;
    case 'skip-call':
      handleSkipCall(userId);
      break;
    case 'offer':
    case 'answer':
    case 'ice-candidate':
      handleSignaling(userId, message);
      break;
    case 'chat-message':
      handleChatMessage(userId, message);
      break;
  }
}

// Handle user joining the matchmaking queue
function handleJoinQueue(userId: string, data: { tags?: string[], skills?: string[] }) {
  const user = users.get(userId);
  if (!user) return;

  user.tags = data.tags;
  user.skills = data.skills;
  
  matchmakingQueue.addToQueue(userId, data.tags, data.skills);
  
  // Try to find a match
  const match = matchmakingQueue.findMatch(userId, data.tags, data.skills);
  if (match) {
    createCallSession(userId, match);
  }
}

// Handle user leaving the queue
function handleLeaveQueue(userId: string) {
  matchmakingQueue.removeFromQueue(userId);
  const user = users.get(userId);
  if (user) {
    user.isInCall = false;
    user.currentPartner = undefined;
  }
}

// Handle call skipping
function handleSkipCall(userId: string) {
  const user = users.get(userId);
  if (!user || !user.currentPartner) return;

  const partner = users.get(user.currentPartner);
  if (partner) {
    // Notify partner about skip
    partner.socket.send(JSON.stringify({
      type: 'partner-skipped',
      from: userId
    }));
    
    // Reset partner state
    partner.isInCall = false;
    partner.currentPartner = undefined;
    
    // Re-queue partner
    matchmakingQueue.addToQueue(partner.id, partner.tags, partner.skills);
  }

  // Reset current user state
  user.isInCall = false;
  user.currentPartner = undefined;
  
  // Re-queue current user
  matchmakingQueue.addToQueue(userId, user.tags, user.skills);
}

// Handle WebRTC signaling
function handleSignaling(userId: string, message: SignalingMessage) {
  if (!message.to) return;
  
  const targetUser = users.get(message.to);
  if (targetUser) {
    targetUser.socket.send(JSON.stringify({
      ...message,
      from: userId
    }));
  }
}

// Handle chat messages
function handleChatMessage(userId: string, message: SignalingMessage) {
  if (!message.to) return;
  
  const targetUser = users.get(message.to);
  if (targetUser) {
    targetUser.socket.send(JSON.stringify({
      type: 'chat-message',
      from: userId,
      message: message.data.message,
      timestamp: new Date()
    }));
  }
}

// Create a call session between two users
function createCallSession(user1Id: string, user2Id: string) {
  const user1 = users.get(user1Id);
  const user2 = users.get(user2Id);
  
  if (!user1 || !user2) return;

  const sessionId = uuidv4();
  
  // Create call session
  const session: CallSession = {
    id: sessionId,
    participants: [user1Id, user2Id],
    startTime: new Date(),
    isActive: true
  };
  
  callSessions.set(sessionId, session);
  
  // Update user states
  user1.isInCall = true;
  user1.currentPartner = user2Id;
  user2.isInCall = true;
  user2.currentPartner = user1Id;
  
  // Remove both users from queue
  matchmakingQueue.removeFromQueue(user1Id);
  matchmakingQueue.removeFromQueue(user2Id);
  
  // Notify both users about the match
  user1.socket.send(JSON.stringify({
    type: 'match-found',
    partnerId: user2Id,
    sessionId: sessionId
  }));
  
  user2.socket.send(JSON.stringify({
    type: 'match-found',
    partnerId: user1Id,
    sessionId: sessionId
  }));
  
  console.log(`Call session created between ${user1Id} and ${user2Id}`);
}

// Handle user disconnection
function handleUserDisconnect(userId: string) {
  const user = users.get(userId);
  if (!user) return;

  // Remove from queue
  matchmakingQueue.removeFromQueue(userId);
  
  // Notify partner if in call
  if (user.currentPartner) {
    const partner = users.get(user.currentPartner);
    if (partner) {
      partner.socket.send(JSON.stringify({
        type: 'partner-disconnected',
        from: userId
      }));
      
      partner.isInCall = false;
      partner.currentPartner = undefined;
      
      // Re-queue partner
      matchmakingQueue.addToQueue(partner.id, partner.tags, partner.skills);
    }
  }
  
  // Remove user
  users.delete(userId);
  
  console.log(`User ${userId} disconnected. Total users: ${users.size}`);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    users: users.size,
    queueLength: matchmakingQueue.getQueueLength(),
    activeCalls: Array.from(callSessions.values()).filter(s => s.isActive).length
  });
});

// Get queue status
app.get('/queue-status', (req, res) => {
  res.json({
    queueLength: matchmakingQueue.getQueueLength(),
    queue: matchmakingQueue.getQueueStatus()
  });
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Connect MongoDB if provided
connectDB().catch(() => {});

server.listen(Number(PORT), HOST, () => {
  console.log(`🚀 Orbit backend server running on ${HOST}:${PORT}`);
  console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
  console.log(`📋 Queue status: http://${HOST}:${PORT}/queue-status`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`🌐 WebSocket: wss://${process.env.RENDER_EXTERNAL_HOSTNAME || 'your-domain.onrender.com'}`);
  }
});
