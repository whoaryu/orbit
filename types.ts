export interface User {
  id: string;
  socket: any; // WebSocket instance
  tags?: string[];
  skills?: string[];
  isInCall: boolean;
  currentPartner?: string;
}

export interface CallSession {
  id: string;
  participants: string[];
  startTime: Date;
  isActive: boolean;
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join-queue' | 'leave-queue' | 'skip-call' | 'chat-message';
  from: string;
  to?: string;
  data: any;
}

export interface ChatMessage {
  from: string;
  message: string;
  timestamp: Date;
}

export interface QueueEntry {
  userId: string;
  tags?: string[];
  skills?: string[];
  timestamp: Date;
}
