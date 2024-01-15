import puppeteer, { Browser } from 'puppeteer';
import logger from '@/config/logger';
let browser: Browser | null = null;

let start_time: number | null = null;

let is_using_browser: boolean = false;

const restart_interval: number = 1000 * 60 * 60 * 1; // restart interval in millisecond now 1 hours

const Puppeteer = {
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

export default Puppeteer;
