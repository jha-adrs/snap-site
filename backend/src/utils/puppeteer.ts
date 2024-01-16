import puppeteer, { Browser, Page } from 'puppeteer';
import logger from '@/config/logger';
import { Cluster } from 'puppeteer-cluster';
import { isValidUrl } from './urlUtils';
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

interface takeScreenShotParams {
    url: string;
    storageKey: string;
    onCompleteFn?: (arg: any) => any;
}
interface screenshotFn {
    page: Page;
    data: {
        url: string;
        storageKey: string;
        onCompleteFn?: (arg: any) => any;
    };
}

let pupeteerCluster: Cluster;

const screenshot = async ({ page, data }: screenshotFn) => {
    logger.info('Starting screenshot for data', { data, key: data.storageKey, url: data.url });
    //await page.goto(data.url);
    const valid = isValidUrl(data.url);
    if (!valid) {
        throw new Error(`Invalid URL found: url ${data.url}, storage key ${data.storageKey}`);
    }
    await page.goto(data.url);
    const path = data.url.replace(/[^a-zA-Z]/g, '_') + '.png';
    const screenshot = await page.screenshot({ path });
    if (data.onCompleteFn) {
        logger.info('Callback function');
        data.onCompleteFn({
            success: 1,
            result: screenshot.byteLength,
        });
    } else {
        logger.info('No callback');
    }
};
const PuppeteerCluster = {
    launchCluster: async function () {
        logger.info('Lauching pupetter cluster');
        pupeteerCluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_CONTEXT, // No shared context
            maxConcurrency: 1,
            monitor: true, // TODO: Change this later
            puppeteerOptions: {
                headless: 'new',
                defaultViewport: { width: 1400, height: 998, isLandscape: true },
            },
            retryDelay: 0, // TODO: Review this
            retryLimit: 1,
            sameDomainDelay: 0,
        });
    },
    takeScreenShot: async function ({ url, storageKey, onCompleteFn }: takeScreenShotParams) {
        try {
            logger.debug('Starting takeScreenshot', { url, storageKey });
            if (!pupeteerCluster) {
                await PuppeteerCluster.launchCluster();
            }
            pupeteerCluster.queue({ url, storageKey, onCompleteFn }, screenshot);
        } catch (error) {
            logger.error('Error in screenshot function', error);
            throw error;
        }
    },
    closeCluster: async function () {
        await pupeteerCluster.idle();
        await pupeteerCluster.close();
    },
};

export default PuppeteerCluster;
