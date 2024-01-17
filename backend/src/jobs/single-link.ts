// Job that handles scraping for all daily links
import prisma from '@/client';
import logger from '@/config/logger';
import { SingleLinkJobData } from '@/types/jobs';
import PuppeteerCluster from '@/utils/puppeteer';
import { redisBullConfig } from '@/utils/redis-helper';
import Queue from 'bull';

export const singleLinkQueue = new Queue('singleLinkScrapeQueue', redisBullConfig);
// Complete job here
async function onCompleteFn(data: any) {
    logger.info('Completed scraping job', data);
    await PuppeteerCluster.closeCluster();
    await prisma.cronhistory.update({
        where: {
            id: data.cronHistoryId,
        },
        data: {
            data: {
                htmlRes: data.htmlUploadRes || {},
                imageRes: data.imageUploadRes || {},
            },
            status: 'SUCCESS',
            updatedAt: new Date(),
            endTime: new Date(),
        },
    });
}

async function singleLinkQueueJob(job: SingleLinkJobData) {
    // Get all data of links and start job
    logger.info('Starting singleLinkQueue job', job.hash);

    const link = await prisma.links.findUnique({
        where: {
            hashedUrl: job.hash,
            timing: job.timing,
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

    const cronHistoryRes = await prisma.cronhistory.create({
        data: {
            links: {
                hash: job.hash,
                url: link?.url,
                timing: job.timing,
            },
            data: {},
            startTime: new Date(),
            status: 'PENDING',
            updatedAt: new Date(),
        },
        select: {
            id: true,
        },
    });
    if (!link) {
        logger.error('Link not found');
        await prisma.cronhistory.update({
            where: {
                id: cronHistoryRes.id,
            },
            data: {
                data: {
                    error: 'Link not found in db',
                },
                startTime: new Date(),
                status: 'PENDING',
                updatedAt: new Date(),
                failureReason: 'Link not found in db',
            },
        });
        return false;
    }
    PuppeteerCluster.fullScrape({
        url: link.url,
        timing: link.timing,
        cronHistoryId: cronHistoryRes.id,
        onCompleteFn,
    });
    logger.info('Single Link scrape res');
    return true;
}
export default singleLinkQueueJob;
