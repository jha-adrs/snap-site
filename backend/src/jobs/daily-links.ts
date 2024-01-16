// Job that handles scraping for all daily links
import prisma from '@/client';
import logger from '@/config/logger';
import PuppeteerCluster from '@/utils/puppeteer';
import { redisBullConfig } from '@/utils/redis-helper';
import Bull from 'bull';
import Queue from 'bull';

export const dailyQueue = new Queue('dailyScrapeQueue', redisBullConfig);

const completedLinks: string[] = [];
const failedLinks: string[] = [];
async function onCompleteFn(data: any) {
    logger.info('Completed daily scraping job for link: ', data);
    //await PuppeteerCluster.closeCluster();
    if (data && data.success === 1) {
        completedLinks.push(data.url);
    } else if (data && data.success === 0) {
        failedLinks.push(data.url);
    } else {
        //TODO: Handle this
        logger.error('Error in onCompleteFn', data);
        // Send mail to admin
    }
    logger.info('Failed links', failedLinks);
    logger.info('Completed links', completedLinks);
}

async function dailyQueueJob(job: Bull.Job, done: Bull.DoneCallback) {
    // Get all data of links and start job
    try {
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
        const links = linksRes.map((link) => {
            return {
                url: link.url,
                hash: link.hashedUrl,
                timing: link.timing,
            };
        });
        const jobHistory = await prisma.cronhistory.create({
            data: {
                links: {
                    ...links,
                },
                status: 'PENDING',
                startTime: new Date(),
                updatedAt: new Date(),
                data: {
                    jobId: job.id,
                },
            },
            select: {
                id: true,
            },
        });
        if (linksRes.length === 0) {
            done(null, 'No links found');
            return;
        }
        for (const link of linksRes) {
            const additionResponse = await PuppeteerCluster.fullScrape({
                url: link.url,
                timing: link.timing,
                cronHistoryId: jobHistory.id,
                onCompleteFn: onCompleteFn,
            });
            if (!additionResponse) {
                logger.error('Error in adding job to puppetter queue');
                done(new Error('Error in adding job to puppetter queue'));
                return;
            }
            logger.info('Job added to puppetter queue');
        }
        done(null, 'Daily Queue Job Done');
    } catch (error: any) {
        logger.error('Error in dailyQueueJob', error);
        done(error);
    }
}
export default dailyQueueJob;
