import { Request, Response } from 'express'
import { matchmakingQueue } from '../singletons/queue'

export async function joinQueue(req: Request, res: Response) {
  const { userId, tags, skills } = req.body || {}
  if (!userId) return res.status(400).json({ error: 'userId required' })
  matchmakingQueue.addToQueue(userId, tags, skills)
  const match = matchmakingQueue.findMatch(userId, tags, skills)
  return res.json({ queued: true, match })
}

export async function leaveQueue(req: Request, res: Response) {
  const { userId } = req.body || {}
  if (!userId) return res.status(400).json({ error: 'userId required' })
  matchmakingQueue.removeFromQueue(userId)
  return res.json({ removed: true })
}

export async function skipCurrent(req: Request, res: Response) {
  const { userId } = req.body || {}
  if (!userId) return res.status(400).json({ error: 'userId required' })
  // For REST, just re-add to queue to simulate skip
  matchmakingQueue.removeFromQueue(userId)
  matchmakingQueue.addToQueue(userId)
  const match = matchmakingQueue.findMatch(userId)
  return res.json({ skipped: true, match })
}

export async function queueStatus(_req: Request, res: Response) {
  return res.json({ length: matchmakingQueue.getQueueLength(), queue: matchmakingQueue.getQueueStatus() })
}

export async function randomFromQueue(_req: Request, res: Response) {
  const status = matchmakingQueue.getQueueStatus()
  if (status.length === 0) return res.json({ userId: null })
  const idx = Math.floor(Math.random() * status.length)
  return res.json({ userId: status[idx].userId })
}





