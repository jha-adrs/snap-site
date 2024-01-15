import express from 'express';
const router = express.Router();
import { trackerController } from '@/controllers';
import { trackerValidation } from '@/validations';
import validate from '@/middlewares/validate';
//router.use(auth());
//Receive hashedURL and get history of the link
router.get(
    '/get-link-history/:id',
    validate(trackerValidation.getLinkHistory),
    trackerController.getLinkHistory
);
router.get('/get-links', validate(trackerValidation.getLinks), trackerController.getLinks);

router.post('/add-link', validate(trackerValidation.addLink), trackerController.addLink);
export default router;
