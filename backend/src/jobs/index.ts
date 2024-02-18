import logger from '@/config/logger';
import dailyQueueJob, { dailyQueue } from './daily-links';
import weeklyQueueJob, { weeklyQueue } from './weekly-links';
import monthlyQueueJob, { monthlyQueue } from './monthly-links';
import singleLinkQueueJob, { singleLinkQueue } from './single-link';
import PuppeteerCluster from '@/utils/puppeteer';
import { Cluster } from 'puppeteer-cluster';

logger.info('Starting Job Handler');
// Clear all jobs
let cluster: Cluster;

(async () => {
    cluster = await PuppeteerCluster.launchCluster();
    logger.info('Puppeteer cluster started');
})();

dailyQueue.process('daily_scrape_job', async (job, done) => {
    logger.info('daily_scrape_job');
    dailyQueueJob(job, done);
});

weeklyQueue.process('weekly_scrape_job', async (job, done) => {
    logger.info('weekly_scrape_job');
    weeklyQueueJob(job, done);
});

monthlyQueue.process('monthly_scrape_job', async (job, done) => {
    logger.info('monthly_scrape_job');
    monthlyQueueJob(job, done);
});

singleLinkQueue.process('single_link_scrape_job', async (job, done) => {
    logger.info('Start single link job');
    singleLinkQueueJob(job.data, done, cluster);
});

// Add link job through FILE upload

// dailyQueue.process('dailyLinkScraper', async (job, done) => {
//     logger.warn('dailyLinkScraper');
//     done(null);
// });

// weeklyQueue.process('weeklyScrapeQueue', async (job, done) => {
//     logger.warn('weeklyLinkScraper');
//     done(null);
// });

// monthlyQueue.process('monthlyScrapeQueue', async (job, done) => {
//     logger.warn('monthlyLinkScraper');
//     done(null);
// });
