import express from 'express';
const router = express.Router();
import { trackerController } from '@/controllers';
import validate from '@/middlewares/validate';
import { trackerValidation } from '@/validations';
import auth from '@/middlewares/auth';
router.use(auth());
//Receive hashedURL and get history of the link
router.post(
    '/start/single',
    validate(trackerValidation.singleLinkCron),
    trackerController.singleLinkCron
);
router.post('/start', validate(trackerValidation.startCron), trackerController.startCron);
router.get(
    '/getPresignedURL',
    validate(trackerValidation.getPresignedURL),
    trackerController.getPresignedURL
);
router.post(
    '/multiplePresignedURL',
    validate(trackerValidation.getMultiplePresignedURLs),
    trackerController.getMultiplePresignedURLs
);
// Starts rescrape job for links which have not been scraped in last 3 days
router.post('/rescrape', validate(trackerValidation.rescrape), trackerController.scheduledRescrape);

export default router;
