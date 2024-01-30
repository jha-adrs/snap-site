// Job that handles scraping for all daily links
import prisma from '@/client';
import logger from '@/config/logger';
import PuppeteerCluster from '@/utils/puppeteer';
import { redisBullConfig } from '@/utils/redis-helper';
import Bull from 'bull';
import Queue from 'bull';
import { singleLinkQueue } from './single-link';
import getHash from '@/utils/link-shortener';
import config from '@/config/config';

export const dailyQueue = new Queue('dailyScrapeQueue', redisBullConfig);
const linkStatus: { [key: string]: boolean } = {};
async function dailyQueueJob(job: Bull.Job, done: Bull.DoneCallback) {
    // Get all data of links and start job
    try {
        logger.info('Starting dailyQueue job', job.id);
        let cronhistoryId: number = -1;
        const linksRes = await prisma.links.findMany({
            where: {
                timing: 'DAILY',
                isActive: true,
            },
            orderBy: {
                hashedUrl: 'asc',
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
                        domain: true,
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
        logger.info('Found links', { length: linksRes.length });
        async function onCompleteFn(data: any) {
            logger.info('Completed daily scraping job for link: ', data);
            //await PuppeteerCluster.closeCluster();
            const urlObj = new URL(data.url);
            const finalURL = data?.includeParams ? data?.url : urlObj.origin + urlObj.pathname;
            if (data && data.success === 1) {
                linkStatus[finalURL] = true;
            } else if (data && data.success === 0) {
                linkStatus[finalURL] = false;
            } else {
                //TODO: Handle this
                logger.error('Error in onCompleteFn', data);
                // Send mail to admin
            }
            const suceessLinksCount = Object.values(linkStatus).filter(
                (val) => val === true
            ).length;
            const failedLinksCount = Object.values(linkStatus).filter(
                (val) => val === false
            ).length;
            const failedLinks = Object.keys(linkStatus).filter((key) => linkStatus[key] === false);
            logger.info('Link status', {
                suceessLinksCount,
                failedLinksCount,
                totalLinks: linksRes.length,
                failedLinks: failedLinks,
            });
            if (suceessLinksCount === linksRes.length) {
                logger.warn('All links completed');
                PuppeteerCluster.emitEvent('jobFinished', 'All links completed');
                if (cronhistoryId !== -1) {
                    await prisma.cronhistory.update({
                        where: {
                            id: cronhistoryId,
                        },
                        data: {
                            status: 'SUCCESS',
                            endTime: new Date(),
                            updatedAt: new Date(),
                        },
                    });
                }
                return done(null, { success: 1, message: 'All links completed' });
            } else if (failedLinksCount === linksRes.length) {
                logger.error('All links failed');
                PuppeteerCluster.emitEvent('jobFinished', 'All links failed');
                if (cronhistoryId !== -1) {
                    await prisma.cronhistory.update({
                        where: {
                            id: cronhistoryId,
                        },
                        data: {
                            status: 'FAILED',
                            endTime: new Date(),
                            updatedAt: new Date(),
                        },
                    });
                }
                return done(new Error('All links failed'));
            } else if (suceessLinksCount + failedLinksCount === linksRes.length) {
                logger.warn('Some links failed');
                PuppeteerCluster.emitEvent('jobFinished', 'Some links failed');
                if (cronhistoryId !== -1) {
                    await prisma.cronhistory.update({
                        where: {
                            id: cronhistoryId,
                        },
                        data: {
                            status: 'FAILED',
                            endTime: new Date(),
                            updatedAt: new Date(),
                        },
                    });
                }
                // Queue the failed links again
                reQueueFailedLinks(failedLinks);
                return done(null, { success: 0, message: 'Some links failed' });
            } else {
                logger.info('Continuing');
            }
        }

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
        cronhistoryId = jobHistory.id;
        if (linksRes.length === 0) {
            done(null, 'No links found');
            return;
        }
        for (const link of linksRes) {
            const additionResponse = await PuppeteerCluster.fullScrape({
                url: link.url,
                timing: link.timing,
                cronHistoryId: jobHistory.id,
                includeParams: link.domains.includeParams,
                onCompleteFn: onCompleteFn,
                params: link.params || '',
            });
            if (!additionResponse) {
                logger.error('Error in adding job to puppetter queue');
                done(new Error('Error in adding job to puppetter queue'));
                return;
            }
            logger.info('Job added to puppetter queue');
        }
    } catch (error: any) {
        logger.error('Error in dailyQueueJob', error);
        done(error);
    }
}

async function reQueueFailedLinks(failedLinks: string[]) {
    logger.info('Requeueing failed links', { failedLinks });
    failedLinks.forEach(async (link) => {
        const { hashedLink } = await getHash(link, config.scraper.hashLength);
        await singleLinkQueue.add(
            'single_link_scrape_job',
            { timing: 'DAILY', hash: hashedLink },
            {
                priority: 1,
                attempts: 3,
                backoff: { type: 'fixed', delay: 1000 },
                removeOnComplete: true,
            }
        );
    });
}

export default dailyQueueJob;
