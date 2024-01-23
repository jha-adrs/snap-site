import express from 'express';
const router = express.Router();
import { trackerController } from '@/controllers';
import validate from '@/middlewares/validate';
import { trackerValidation } from '@/validations';
//router.use(auth());
//Receive hashedURL and get history of the link
router.post('/start/single', trackerController.singleLinkCron, trackerController.singleLinkCron);
router.post('/start', validate(trackerValidation.startCron), trackerController.startCron);
router.get('/getPresignedURL', trackerController.getPresignedURL);
router.get('/listS3Objects', trackerController.getDomainObjects);
router.post('/multiplePresignedURL', trackerController.getMultiplePresignedURLs);
export default router;
