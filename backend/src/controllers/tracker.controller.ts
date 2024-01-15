import logger from '@/config/logger';
import { dailyQueue } from '@/jobs/daily-links';
import { monthlyQueue } from '@/jobs/monthly-links';
import { singleLinkQueue } from '@/jobs/single-link';
import { weeklyQueue } from '@/jobs/weekly-links';
import catchAsync from '@/utils/catchAsync';
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

export default {
    startCron,
    singleLinkCron,
};
