import express from 'express';
const router = express.Router();
import { trackerController } from '@/controllers';
import validate from '@/middlewares/validate';
import { trackerValidation } from '@/validations';
//router.use(auth());
//Receive hashedURL and get history of the link
router.get('/start/single', trackerController.singleLinkCron, trackerController.singleLinkCron);
router.get('/start', validate(trackerValidation.startCron), trackerController.startCron);
router.get('/getPresignedURL', trackerController.getPresignedURL);
router.get('/listS3Objects', trackerController.getDomainObjects);
router.get('/multiplePresignedURL', trackerController.getMultiplePresignedURLs);
export default router;
