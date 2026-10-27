import { Router } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { getLearnerProgress } from '../utils/gamification.js';

const router = Router();
router.use(requireAuth);

router.get('/me', (req: AuthenticatedRequest, res) => res.json(getLearnerProgress(req.user!.userId)));

export default router;
