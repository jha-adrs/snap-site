import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import puppeteer from 'puppeteer-extra';
import logger from '@/config/logger';
import { Cluster } from 'puppeteer-cluster';
import { fullScrapeCluster, takeScreenshotCluster } from '@/scripts/scraper';
import { links_timing } from '@prisma/client';

puppeteer.use(StealthPlugin());
export interface AddToPuppeteerQueueParams {
    url: string;
    timing: links_timing;
    cronHistoryId?: number;
    onCompleteFn?: (arg: any) => any;
    includeParams: boolean;
    params?: string;
}

let pupeteerCluster: Cluster;

const PuppeteerCluster = {
    launchCluster: async function () {
        logger.info('Lauching pupetter cluster');
        pupeteerCluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_CONTEXT, // No shared context
            maxConcurrency: 1,
            monitor: false, // TODO: Change this later
            puppeteer: puppeteer,
            puppeteerOptions: {
                headless: 'new',
                defaultViewport: { width: 1400, height: 998, isLandscape: true },
                args: [
                    '--ignore-certificate-errors',
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                ],
            },
            retryDelay: 0, // TODO: Review this
            retryLimit: 0,
            sameDomainDelay: 5,
        });
        return pupeteerCluster;
    },
    takeScreenShot: async function ({ url, onCompleteFn }: AddToPuppeteerQueueParams) {
        try {
            logger.debug('Starting takeScreenshot', { url });
            if (!pupeteerCluster) {
                await PuppeteerCluster.launchCluster();
            }
            pupeteerCluster.queue({ url, onCompleteFn }, takeScreenshotCluster);
        } catch (error) {
            logger.error('Error in screenshot function', error);
            throw error;
        }
    },
    fullScrape: async function ({
        url,
        timing,
        onCompleteFn,
        cronHistoryId,
        includeParams,
        params,
    }: AddToPuppeteerQueueParams) {
        try {
            logger.info('Starting full scrape');
            if (!pupeteerCluster) {
                await PuppeteerCluster.launchCluster();
            }
            // Add event emitter to signal when cluster is idle or closed
            pupeteerCluster.on('taskerror', (err, data, willRetry) => {
                logger.error(`Error crawling :`, data, willRetry, err);
            });
            pupeteerCluster.on('jobFinished', (...params) => {
                logger.info('Job finished', params);
                pupeteerCluster.close();
            });
            pupeteerCluster.queue(
                { url, timing, onCompleteFn, cronHistoryId, includeParams, params },
                fullScrapeCluster
            );
            return true;
        } catch (error) {
            logger.info('Error in full scrape', error);
            await PuppeteerCluster.closeCluster();
            return false;
        }
    },
    closeCluster: async function () {
        logger.info('Closing cluster');
        await pupeteerCluster.idle();
        await pupeteerCluster.close();
    },
    emitEvent: async function (event: string, ...params: any) {
        logger.info('Emitting event', event, params);
        pupeteerCluster.emit(event, params);
    },
};

export default PuppeteerCluster;
