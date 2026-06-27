import { QueueEntry, User } from './types';

export class MatchmakingQueue {
  private queue: QueueEntry[] = [];
  private users: Map<string, User> = new Map();

  addToQueue(userId: string, tags?: string[], skills?: string[]): void {
    // Remove user from queue if already there
    this.removeFromQueue(userId);
    
    const entry: QueueEntry = {
      userId,
      tags,
      skills,
      timestamp: new Date()
    };
    
    this.queue.push(entry);
    console.log(`User ${userId} added to queue. Queue length: ${this.queue.length}`);
  }

  removeFromQueue(userId: string): void {
    this.queue = this.queue.filter(entry => entry.userId !== userId);
  }

  findMatch(userId: string, tags?: string[], skills?: string[]): string | null {
    if (this.queue.length < 2) return null;

    // Simple FIFO matching for MVP
    // Later: implement tag-based matching
    const userIndex = this.queue.findIndex(entry => entry.userId === userId);
    if (userIndex === -1) return null;

    // Find next available user
    for (let i = 0; i < this.queue.length; i++) {
      if (i !== userIndex) {
        const potentialMatch = this.queue[i];
        if (potentialMatch.userId !== userId) {
          return potentialMatch.userId;
        }
      }
    }

    return null;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getQueueStatus(): QueueEntry[] {
    return [...this.queue];
  }

  clearQueue(): void {
    this.queue = [];
  }
}
