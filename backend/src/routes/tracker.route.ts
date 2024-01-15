import express from 'express';
const router = express.Router();
import { trackerController } from '@/controllers';
//router.use(auth());
//Receive hashedURL and get history of the link

router.get('/start', trackerController.startCron);

export default router;
