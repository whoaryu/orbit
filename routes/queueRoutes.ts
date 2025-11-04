import { Router } from 'express'
import { joinQueue, leaveQueue, skipCurrent, queueStatus, randomFromQueue } from '../controllers/queueController'

const router = Router()

router.post('/join', joinQueue)
router.post('/leave', leaveQueue)
router.post('/skip', skipCurrent)
router.get('/status', queueStatus)
router.get('/random', randomFromQueue)

export default router




