import logger from '@/config/logger';
import { dailyQueue } from '@/jobs/daily-links';
import { monthlyQueue } from '@/jobs/monthly-links';
import { singleLinkQueue } from '@/jobs/single-link';
import { weeklyQueue } from '@/jobs/weekly-links';
import { fileService } from '@/services';
import { LinkDataKeys } from '@/types/response';
import catchAsync from '@/utils/catchAsync';
import { isValidUrl } from '@/utils/urlUtils';
import { trackerValidation } from '@/validations';
const startCron = catchAsync(async (req, res) => {
    try {
        logger.info(`Start cron start`);
        const { timing } = await trackerValidation.startCron.parseAsync(req.body);
        if (timing === 'DAILY') {
            await dailyQueue.add('daily_scrape_job', {
                priority: 1,
                attempts: 1,
                backoff: { type: 'exponential', delay: 60 * 1000 },
                removeOnComplete: true,
            });
        } else if (timing === 'WEEKLY') {
            await weeklyQueue.add('weekly_scrape_job', {
                priority: 1,
                attempts: 1,
                backoff: { type: 'exponential', delay: 60 * 1000 },
                removeOnComplete: true,
            });
        } else if (timing === 'MONTHLY') {
            await monthlyQueue.add('monthly_scrape_job', {
                priority: 1,
                attempts: 1,
                backoff: { type: 'exponential', delay: 60 * 1000 },
                removeOnComplete: true,
            });
        }

        logger.info('scrape job added', timing);
        return res.status(200).json({ success: 1, message: 'OK' });
    } catch (error) {
        logger.error('Error in tracker controller', error);
        return res.status(500).json({ success: 0, message: 'Something went wrong' });
    }
});

const singleLinkCron = catchAsync(async (req, res) => {
    try {
        logger.info('Starting single link cron');
        const { timing, hash } = await trackerValidation.singleLinkCron.parseAsync(req.body);
        logger.info('Adding single link cron job', { timing, hash });
        await singleLinkQueue.add(
            'single_link_scrape_job',
            { timing, hash },
            {
                priority: 1,
                attempts: 10,
                backoff: { type: 'exponential', delay: 60 * 1000 },
                removeOnComplete: true,
            }
        );
        return res.status(200).json({ success: 1, message: 'OK' });
    } catch (error) {
        logger.error('Error in singleLinkCron', error);
        return res.status(500).json({ success: 0, message: 'Something went wrong' });
    }
});

const getPresignedURL = catchAsync(async (req, res) => {
    try {
        logger.info('Getting presigned url');
        const key = req.body.key;
        if (!key) {
            return res.status(400).json({ success: 0, message: 'Invalid key' });
        }
        const url = await fileService.getPresignedURL(key);
        return res.status(200).json({ success: 1, message: 'OK', data: url });
    } catch (error) {
        logger.error('Error in getPresignedURL', error);
        return res.status(500).json({ success: 0, message: 'Something went wrong' });
    }
});

const getDomainObjects = catchAsync(async (req, res) => {
    //Get all domain objects under a specific folder
    logger.info('Getting domain objects');
    const { timing, hash, url, domain } = await trackerValidation.getDomainObjects.parseAsync(
        req.body
    );
    let searchPrefix: string;
    if (url && !isValidUrl(url)) {
        return res.status(400).json({ success: 0, message: 'Invalid url' });
    } else if (url) {
        const urlObject = new URL(url);
        searchPrefix = `${timing}/${urlObject.hostname}/${hash}`;
    } else {
        searchPrefix = `${timing}/${domain}/${hash}`;
    }
    const response = await fileService.listS3Objects({ prefix: searchPrefix });
    logger.info('Got domain objects', { response });
    return res.status(200).json({ success: 1, message: 'OK', data: response });
});

const getMultiplePresignedURLs = catchAsync(async (req, res) => {
    try {
        //TODO: Cache the presigned urls in redis
        logger.info('Getting multiple presigned urls');
        const { url, hashedUrl, timing, keys } =
            await trackerValidation.getMultiplePresignedURLs.parseAsync(req.body);
        logger.info('Getting keys', { keys, url, hashedUrl, timing });
        const presignedURLs: LinkDataKeys[] = [];
        keys.map(async (key) => {
            const { htmlObjectKey, screenshotObjectKey, thumbnailObjectKey } = key;
            const urls = await Promise.all([
                fileService.getPresignedURL(`${htmlObjectKey}`),
                fileService.getPresignedURL(`${screenshotObjectKey}`),
                fileService.getPresignedURL(`${thumbnailObjectKey}`),
            ]);
            if (urls.length === 3 && urls[0] && urls[1] && urls[2]) {
                presignedURLs.push(
                    {
                        key: htmlObjectKey,
                        url: urls[0].url,
                    },
                    {
                        key: screenshotObjectKey,
                        url: urls[1].url,
                    },
                    {
                        key: thumbnailObjectKey,
                        url: urls[2].url,
                    }
                );
            } else {
                logger.error('Error in getting multiple presigned urls', urls);
            }
        });

        return res.status(200).json({ success: 1, message: 'OK', data: presignedURLs });
    } catch (error) {
        logger.error('Error in getMultiplePresignedURLs', error);
        return res.status(500).json({ success: 0, message: 'Something went wrong' });
    }
});

export default {
    startCron,
    singleLinkCron,
    getPresignedURL,
    getDomainObjects,
    getMultiplePresignedURLs,
};
