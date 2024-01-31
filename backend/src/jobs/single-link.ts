// Job that handles scraping for all daily links
import prisma from '@/client';
import logger from '@/config/logger';
import { SingleLinkJobData } from '@/types/jobs';
import PuppeteerCluster from '@/utils/puppeteer';
import { redisBullConfig } from '@/utils/redis-helper';
import Bull from 'bull';
import Queue from 'bull';

export const singleLinkQueue = new Queue('singleLinkScrapeQueue', redisBullConfig);

async function singleLinkQueueJob(job: SingleLinkJobData, done: Bull.DoneCallback) {
    // Get all data of links and start job
    try {
        logger.info('Starting singleLinkQueue job', job.hash);
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
            done(null);
        }
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
                        includeParams: true, // If true, include params in the url
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
            logger.error('Link not found', job.hash, job.timing);
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
            throw new Error('Link not found in db');
            return false;
        }
        PuppeteerCluster.fullScrape({
            url: link.url,
            timing: link.timing,
            cronHistoryId: cronHistoryRes.id,
            includeParams: link.domains.includeParams,
            onCompleteFn,
            params: link.params || '',
        });
        logger.info('Single Link scrape res');
        return true;
    } catch (error) {
        logger.error('Error in singleLinkQueue job', error);
        done(error as Error);
        return false;
    }
}
export default singleLinkQueueJob;
