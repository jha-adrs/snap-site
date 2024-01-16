// Job that handles scraping for all daily links
import prisma from '@/client';
import logger from '@/config/logger';
import { redisBullConfig } from '@/utils/redis-helper';
import Bull from 'bull';
import Queue from 'bull';

export const dailyQueue = new Queue('dailyScrapeQueue', redisBullConfig);

async function dailyQueueJob(job: Bull.Job, done: Bull.DoneCallback) {
    // Get all data of links and start job
    logger.info('Starting dailyQueue job', job.id);
    const linksRes = await prisma.links.findMany({
        where: {
            timing: 'DAILY',
            isActive: true,
        },
        select: {
            id: true,
            url: true,
            hashedUrl: true,
            isActive: true,
            timing: true,
            createdAt: true,
            params: true,
            domains: {
                select: {
                    id: true,
                    domain: true,
                    isActive: true,
                },
            },
            // userlinkmap: {
            //     select: {
            //         id: true,
            //         assignedName: true,
            //         tags: true,
            //         timing: true,
            //         userId: true,
            //         linkId: true,
            //     }
            // }
        },
    });
    logger.info('Found links', linksRes.length);
    for (const link of linksRes) {
        await dailyQueue.add('dailyLinkScraper', link, {
            priority: 5,
            attempts: 10,
            backoff: { type: 'exponential', delay: 60 * 1000 },
            removeOnComplete: true,
        });
        logger.info('Job added for link', link);
    }
    done(null, 'Daily Queue Job Done');
}
export default dailyQueueJob;
