import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import puppeteer from 'puppeteer-extra';
import logger from '@/config/logger';
import { Cluster } from 'puppeteer-cluster';
import { fullScrapeCluster } from '@/scripts/scraper';
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
            maxConcurrency: 4,
            monitor: false, // TODO: Change this later
            puppeteer: puppeteer,
            puppeteerOptions: {
                headless: 'new',
                defaultViewport: { width: 1600, height: 998, isLandscape: true }, // Adjust based on screenshot quality preference
                // args: [
                //     '--ignore-certificate-errors',
                //     '--no-sandbox',
                //     '--disable-setuid-sandbox',
                //     '--disable-accelerated-2d-canvas',
                //     '--disable-gpu',
                // ],
            },
            retryDelay: 5, // TODO: Review this
            retryLimit: 0,
            sameDomainDelay: 5,
        });
        return pupeteerCluster;
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
                logger.info('Restarting cluster');
                await PuppeteerCluster.launchCluster();
            }
            await pupeteerCluster.queue(
                { url, timing, onCompleteFn, cronHistoryId, includeParams, params },
                fullScrapeCluster
            );
            return true;
        } catch (error) {
            logger.info('Error in full scrape', error);
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
