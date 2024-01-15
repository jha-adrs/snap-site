import logger from '@/config/logger';
import dailyQueueJob, { dailyQueue } from './daily-links';
import weeklyQueueJob, { weeklyQueue } from './weekly-links';
import monthlyQueueJob, { monthlyQueue } from './monthly-links';
import singleLinkQueueJob, { singleLinkQueue } from './single-link';

logger.info('Starting Job Handler');

dailyQueue.process('daily_scrape_job', async (job, done) => {
    logger.info('daily_scrape_job');
    const res = await dailyQueueJob();
    done(null, res);
});

weeklyQueue.process('weekly_scrape_job', async (job, done) => {
    logger.info('weekly_scrape_job');
    const res = await weeklyQueueJob();
    done(null, res);
});

monthlyQueue.process('monthly_scrape_job', async (job, done) => {
    logger.info('monthly_scrape_job');
    const res = await monthlyQueueJob();
    done(null, res);
});

dailyQueue.process('dailyLinkScraper', async (job, done) => {
    logger.warn('dailyLinkScraper');
    done(null);
});

weeklyQueue.process('weeklyScrapeQueue', async (job, done) => {
    logger.warn('weeklyLinkScraper');
    done(null);
});

monthlyQueue.process('monthlyScrapeQueue', async (job, done) => {
    logger.warn('monthlyLinkScraper');
    done(null);
});

singleLinkQueue.process('single_link_scrape_job', async (job, done) => {
    logger.warn('Start single link job');
    const res = await singleLinkQueueJob(job.data);
    done(null, res);
});
