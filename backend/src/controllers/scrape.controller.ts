// For scraping the data from the website
import logger from '@/config/logger';
import catchAsync from '@/utils/catchAsync';
import getHash from '@/utils/link-shortener';
const tryLink = catchAsync(async (req, res) => {
    logger.info(`Get hashed link ${JSON.stringify(req.body)}`);
    const link = req.body.link || 'https://www.google.com';
    const hashedLink = await getHash(link, 6);
    const url = new URL(link);
    logger.info(`Hashed link ${JSON.stringify(hashedLink)}`);
    return res.status(200).send(hashedLink);
});

export default {
    tryLink,
};
