import auth from '@/middlewares/auth';
import express from 'express';
import { scrapeController } from '@/controllers';
const router = express.Router();

router.get('/:hashedLink', scrapeController.getScrapedData);
router.use(auth());
// Loads data from website and saves it
router.post('/scrape-link', scrapeController.tryLink);

export default router;
