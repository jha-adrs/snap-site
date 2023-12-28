import express from 'express';
const router = express.Router();
import { trackerController } from '@/controllers';
router.route('/').post(trackerController.addLink);

export default router;
