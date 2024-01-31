// Pritority Job to rescrape links which have not been scraped in last 3 days
import prisma from '@/client';
import logger from '@/config/logger';
import { redisBullConfig } from '@/utils/redis-helper';
import { postToSlack } from '@/utils/slack';
import { links_timing } from '@prisma/client';
import userAgents from 'user-agents';
import Bull from 'bull';
import Queue from 'bull';
import { Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import getHash from '@/utils/link-shortener';
import config from '@/config/config';
import { fileService, linksService } from '@/services';
// Clear older jobs
logger.info('Starting rescrapeLinksQueue');
export const rescrapeLinksQueue = new Queue('rescrapeLinksQueue', redisBullConfig);
rescrapeLinksQueue.clean(0, 'completed');

rescrapeLinksQueue.process('rescrape_links_job', async (job: Bull.Job, done: Bull.DoneCallback) => {
    logger.info('rescrape_links_job');
    rescrapeLinksQueueJob(job, done);
});

const rescrapeLinksQueueJob = async (job: Bull.Job, done: Bull.DoneCallback) => {
    try {
        const unscrapedLinks = await prisma.links.findMany({
            where: {
                timing: job.data.timing,
                linkdata: {
                    none: {
                        createdAt: {
                            gt: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000),
                        },
                    },
                },
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
            },
        });
        const count = await prisma.links.count({
            where: {
                timing: job.data.timing,
                linkdata: {
                    none: {
                        createdAt: {
                            gt: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000),
                        },
                    },
                },
            },
        });
        logger.info('Found unscraped links', { length: unscrapedLinks.length });
        if (count === 0) {
            logger.warn('No unscraped links found');
            return done(null, { success: 1, message: 'OK', data: unscrapedLinks, count });
        }
        // Launch cluster
        puppeteer.use(StealthPlugin());
        const browser = await puppeteer.launch({
            headless: 'new',
            defaultViewport: { width: 1600, height: 998, isLandscape: true },
            args: [
                '--ignore-certificate-errors',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
            ],
        });
        const agents = new userAgents({ deviceCategory: 'desktop' });
        const failedLinks = [];
        for (const link of unscrapedLinks) {
            try {
                logger.info('Starting full rescrape for ', { url: link.url });
                const urlObj = new URL(link.url);
                const finalURL = link.domains.includeParams
                    ? link?.url
                    : urlObj.origin + urlObj.pathname;
                const page = await browser.newPage();
                page.setUserAgent(agents.toString());
                await page.goto(finalURL, { waitUntil: 'networkidle2' });
                await uploadFiles(page, finalURL, job.data.timing);
                await page.close();
            } catch (error) {
                logger.error('Error in rescrapeLinksQueueJob', error, failedLinks);
                failedLinks.push(link);
            }
        }
        await browser.close();
        postToSlack(`
        Found ${failedLinks.length} failed links, for timing ${job.data.timing}`);
        return done(null, { success: 1, message: 'OK', data: failedLinks, count });
    } catch (error) {
        logger.error('Error in rescrapeLinksQueueJob', error);
        return done(error as Error);
    }
};

const uploadFiles = async (page: Page, finalUrl: string, timing: links_timing) => {
    const html = await page.content();
    const screenshot = await page.screenshot({ fullPage: true });
    const smallScreenshot = await page.screenshot({ fullPage: false });
    const { hashedLink, originalLink } = await getHash(finalUrl, config.scraper.hashLength);
    const timestamp = Date.now();
    const urlObj = new URL(finalUrl);

    const htmlUploadRes = await fileService.uploadFile({
        fileName: `${hashedLink}`,
        file: Buffer.from(html),
        domainName: urlObj.hostname,
        originalUrl: originalLink,
        hashedUrl: hashedLink,
        fileType: 'html',
        timing: timing,
        timestamp,
    });
    const screenshotUploadRes = await fileService.uploadFile({
        fileName: `${hashedLink}`,
        file: screenshot,
        domainName: urlObj.hostname,
        originalUrl: originalLink,
        hashedUrl: hashedLink,
        fileType: 'png',
        timing: timing,
        timestamp,
    });
    const smallScreenshotUploadRes = await fileService.uploadFile({
        fileName: `${hashedLink}-small`,
        file: smallScreenshot,
        domainName: urlObj.hostname,
        originalUrl: originalLink,
        hashedUrl: hashedLink,
        fileType: 'png',
        timing: timing,
        timestamp,
    });
    await linksService.addLinkData({
        htmlObjectKey: htmlUploadRes.key,
        screenshotKey: screenshotUploadRes.key,
        thumbnailKey: smallScreenshotUploadRes.key,
        timing: timing,
        metadata: {
            html: htmlUploadRes.metadata ? htmlUploadRes.metadata : {},
            screenshot: screenshotUploadRes.metadata ? screenshotUploadRes.metadata : {},
        },
        images: { fullPage: screenshotUploadRes.key },
        hashedUrl: hashedLink,
    });
};
