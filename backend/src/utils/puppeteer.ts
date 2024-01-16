import puppeteer, { Browser } from 'puppeteer';
import logger from '@/config/logger';
import { Cluster } from 'puppeteer-cluster';
import { fullScrapeCluster, takeScreenshotCluster } from '@/scripts/scraper';
import { links_timing } from '@prisma/client';
let browser: Browser | null = null;

let start_time: number | null = null;

let is_using_browser: boolean = false;

const restart_interval: number = 1000 * 60 * 60 * 1; // restart interval in millisecond now 1 hours

export const Puppeteer = {
    getBrowser: async function () {
        logger.info('browser already exist ==>', !(browser == null));
        if (browser) {
            const current_time = new Date().getTime();
            if (!is_using_browser) {
                if (start_time && current_time - start_time >= restart_interval) {
                    logger.info(' restarting browser ');
                    await this.closeBrowser();
                    browser = await this.createBrowser();
                }
            } else {
                logger.info(' browser in use ');
            }
            return browser;
        }
        browser = await this.createBrowser();
        return browser;
    },
    createBrowser: async function () {
        logger.info(' creating new browser ');
        start_time = new Date().getTime();
        return await puppeteer.launch({
            args: [
                '--ignore-certificate-errors',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
            ],
            headless: 'new',
            defaultViewport: { width: 1400, height: 998, isLandscape: true },
        });
    },
    closeBrowser: async function () {
        logger.info('closing current browser');
        if (browser) await browser.close();
    },
    setIsUsingBrowser: function (value: boolean) {
        if (value != null) is_using_browser = value;
        else is_using_browser = !is_using_browser;
    },
    getIsUsingBrowser: function () {
        return is_using_browser;
    },
};

export interface AddToPuppeteerQueueParams {
    url: string;
    timing?: links_timing;
    cronHistoryId?: number;
    onCompleteFn?: (arg: any) => any;
}

let pupeteerCluster: Cluster;

const PuppeteerCluster = {
    launchCluster: async function () {
        logger.info('Lauching pupetter cluster');
        pupeteerCluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_CONTEXT, // No shared context
            maxConcurrency: 4,
            monitor: false, // TODO: Change this later
            puppeteerOptions: {
                headless: 'new',
                defaultViewport: { width: 1400, height: 998, isLandscape: true },
            },
            retryDelay: 0, // TODO: Review this
            retryLimit: 1,
            sameDomainDelay: 0,
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
    }: AddToPuppeteerQueueParams) {
        try {
            logger.info('Starting full scrape');
            if (!pupeteerCluster) {
                await PuppeteerCluster.launchCluster();
            }
            pupeteerCluster.queue({ url, timing, onCompleteFn, cronHistoryId }, fullScrapeCluster);
            return true;
        } catch (error) {
            logger.info('Error in full scrape', error);
            await PuppeteerCluster.closeCluster();
            return false;
        }
    },
    closeCluster: async function () {
        await pupeteerCluster.idle();
        await pupeteerCluster.close();
    },
};

export default PuppeteerCluster;
