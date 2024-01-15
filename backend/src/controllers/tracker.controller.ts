import logger from '@/config/logger';
import { dailyQueue } from '@/jobs/daily-links';
import { monthlyQueue } from '@/jobs/monthly-links';
import { weeklyQueue } from '@/jobs/weekly-links';
import catchAsync from '@/utils/catchAsync';
import { trackerValidation } from '@/validations';
const startCron = catchAsync(async (req, res) => {
    try {
        logger.info(`Start cron`, req.body);
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

        logger.info('scrape job', timing);
        return res.status(200).json({ success: 1, message: 'OK' });
    } catch (error) {
        logger.error('Error in tracker controller', error);
        return res.status(500).json({ success: 0, message: 'Something went wrong' });
    }
});

export default {
    startCron,
};
