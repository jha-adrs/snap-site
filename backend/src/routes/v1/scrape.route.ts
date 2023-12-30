import auth from '@/middlewares/auth';
import express from 'express';
const router = express.Router();
router.use(auth());
// Loads data from website and saves it
router.post('/scrape-link')