// For scraping the data from the website
import logger from '@/config/logger';
import catchAsync from '@/utils/catchAsync';
import getHash from '@/utils/link-shortener';
import { fullScrape } from '@/scripts/scraper';
import { readFile } from 'fs/promises';
const tryLink = catchAsync(async (req, res) => {
    logger.info(`Get hashed link ${JSON.stringify(req.body)}`);
    const link = req.body.url || 'https://www.google.com';
    const hashedLink = await getHash(link, 6);
    const url = new URL(link);
    fullScrape({
        url: url.href,
        hostname: url.hostname,
        priceElement: undefined,
        includeImages: false,
        includeVideos: false,
    });
    logger.info(`Hashed link ${JSON.stringify(hashedLink)}`, { url });
    return res.status(200).send(hashedLink);
});

//Renders the scraped data
const getScrapedData = catchAsync(async (req, res) => {
    logger.info(`Get scraped data ${JSON.stringify(req.params)}`);
    const hashedLink = req.params.hashedLink;
    readFile(`./${hashedLink}.html`, 'utf8').then((data) => {
        logger.info('File read');
        return res.status(200).send(data);
    });
});

export default {
    tryLink,
    getScrapedData,
};
