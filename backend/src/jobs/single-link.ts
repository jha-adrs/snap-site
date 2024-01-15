// Job that handles scraping for all daily links
import prisma from '@/client';
import logger from '@/config/logger';
import { SingleLinkJobData } from '@/types/jobs';
import { redisBullConfig } from '@/utils/redis-helper';
import Queue from 'bull';

export const singleLinkQueue = new Queue('singleLinkScrapeQueue', redisBullConfig);

async function singleLinkQueueJob(job: SingleLinkJobData) {
    // Get all data of links and start job
    logger.info('Starting singleLinkQueue job', job.hash);
    const link = await prisma.links.findUnique({
        where: {
            hashedUrl: job.hash,
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
    logger.info('Found link', link);
    // Complete job here

    return true;
}
export default singleLinkQueueJob;
