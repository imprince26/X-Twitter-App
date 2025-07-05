import { Router } from 'express';
import { trackImpression, getAnalytics } from '../controllers/analyticsController';

const router = Router();

router.post('/impression', trackImpression);
router.get('/:type/:targetId', getAnalytics);

export default router;