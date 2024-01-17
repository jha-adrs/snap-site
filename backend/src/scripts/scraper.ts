// Scrapes a given link and extracts data
import userAgents from 'user-agents';
import logger from '@/config/logger';
import { load } from 'cheerio';
import axios, { AxiosError } from 'axios';
import { isValidUrl } from '@/utils/urlUtils';
import getHash from '@/utils/link-shortener';
import { fileService, linksService } from '@/services';
import { UploadFileParams } from '@/services/file.service';
import config from '@/config/config';
import puppeteer from 'puppeteer-core';
import { Page } from 'puppeteer';
import { links_timing } from '@prisma/client';
/**
 * Type I-Full scrape, save everything on the page
 * Type II-Scrape only the required data, can be class,id or tag
 */
interface FullScrapeParams {
    url: string;
    hostname: string;
    priceElement: string | undefined;
    includeImages: boolean;
}
export async function fullScrape(scrapeData: FullScrapeParams) {
    try {
        //Scrape and save complete page
        logger.info(`Starting Full scrape:`, scrapeData);
        if (!isValidUrl(scrapeData.url)) {
            logger.error('Invalid URL');
            throw new Error('Invalid URL');
        }
        const { data } = await axios.get(scrapeData.url);
        logger.info('Received URL data');
        const $ = load(data);
        const fullPage = $('html').html();
        //Save to html to file
        if (!fullPage) throw new Error('Error in scraping website');
        const { hashedLink, originalLink } = await getHash(
            scrapeData.url,
            config.scraper.hashLength
        );
        //Save the html to a file using fs
        const fileUploadParams: UploadFileParams = {
            fileName: `${hashedLink}.html`,
            file: Buffer.from(fullPage),
            domainName: scrapeData.hostname,
            originalUrl: originalLink,
            hashedUrl: hashedLink,
            fileType: 'html',
        };
        const fileResponse = await fileService.uploadFile(fileUploadParams);
        logger.info('File upload response', { fileResponse });
        return {
            success: 1,
            fileResponse,
            hashedLink,
        };
    } catch (error) {
        if (error instanceof AxiosError) {
            logger.error(`Error in scraping website ${error.message}`);
            return {
                success: 0,
                error: 'There was an error in scraping the website',
            };
        } else {
            logger.error(error);
            return {
                success: 0,
                error: 'Something went wrong',
            };
        }
    }
}

// Take page screenshot
interface ScreenshotParams {
    url: string | string[];
    hostname: string;
}
export async function takeScreenshot({ url, hostname }: ScreenshotParams) {
    try {
        logger.debug(`Starting screenshot:`, { url, hostname });
        //Check if array or single URL
        const results = [];
        if (!isValidUrl(url)) {
            logger.error('Invalid URL');
            throw new Error('Invalid URL(s)');
        }
        let urls = [];
        if (Array.isArray(url)) {
            urls = url;
        } else {
            urls.push(url);
        }
        const browser = await puppeteer.launch();
        for (const url of urls) {
            const page = await browser.newPage();
            await page.goto(url);
            const buffer = await page.screenshot({ fullPage: true });
            // TODO: Use promise all later
            await page.close();
            const { hashedLink, originalLink } = await getHash(url, config.scraper.hashLength);
            const fileUploadParams: UploadFileParams = {
                domainName: hostname,
                file: buffer,
                hashedUrl: hashedLink,
                originalUrl: originalLink,
                fileType: 'png',
                fileName: `${hashedLink}-${Date.now()}`,
            };
            const fileResponse = await fileService.uploadFile(fileUploadParams);
            results.push(fileResponse);
            logger.info('File upload response', { fileResponse });
        }
        browser.close();
        return results;
    } catch (error) {
        logger.error(error);
        throw new Error('Error in taking screenshot');
    }
}

interface screenshotFn {
    page: Page;
    data: {
        url: string;
        onCompleteFn?: (arg: any) => any;
    };
}
export async function takeScreenshotCluster({ page, data }: screenshotFn) {
    logger.info('Starting screenshot for data', { data, url: data.url });
    //await page.goto(data.url);
    const valid = isValidUrl(data.url);
    if (!valid) {
        throw new Error(`Invalid URL found: url ${data.url}`);
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
}

interface FullScrapeClusterType {
    page: Page;
    data: {
        url: string;
        priceElement?: string;
        timing: links_timing;
        onCompleteFn?: (arg: any) => any;
        cronHistoryId?: number;
        includeParams: boolean;
        params?: string;
    };
}

export async function fullScrapeCluster({ page, data }: FullScrapeClusterType) {
    try {
        logger.info('Starting full scrape for data', { data, url: data.url });
        // We get screenshot and html
        const valid = isValidUrl(data.url);
        if (!valid) {
            throw new Error(`Invalid URL found: url ${data.url}`);
        }
        const urlObj = new URL(data.url);
        // If includeParams is false, remove params from url
        const finalScrapingUrl = data.includeParams ? data.url : urlObj.origin + urlObj.pathname;
        const userAgent = new userAgents({ deviceCategory: 'desktop' });
        await page.setUserAgent(userAgent.toString());
        await page.goto(finalScrapingUrl, { waitUntil: 'networkidle2', timeout: 120000 });
        // Wait for the page to load
        const html = await page.content();
        const screenshot = await page.screenshot({ fullPage: true });
        // Save html and screenshot to S3
        const { hashedLink, originalLink } = await getHash(
            finalScrapingUrl,
            config.scraper.hashLength
        );
        const timestamp = Date.now();
        const htmlUploadRes = await fileService.uploadFile({
            fileName: `${hashedLink}`,
            file: Buffer.from(html),
            domainName: urlObj.hostname,
            originalUrl: originalLink,
            hashedUrl: hashedLink,
            fileType: 'html',
            timing: data.timing,
            timestamp,
        });
        const screenshotUploadRes = await fileService.uploadFile({
            fileName: `${hashedLink}`,
            file: screenshot,
            domainName: urlObj.hostname,
            originalUrl: originalLink,
            hashedUrl: hashedLink,
            fileType: 'png',
            timing: data.timing,
            timestamp,
        });
        logger.info('File upload response', { htmlUploadRes, screenshotUploadRes });
        // Extract price from the page if priceElement is provided later
        // Add link data
        await linksService.addLinkData({
            htmlObjectKey: htmlUploadRes.key,
            screenshotKey: screenshotUploadRes.key,
            timing: data.timing,
            metadata: {
                html: htmlUploadRes.metadata ? htmlUploadRes.metadata : {},
                screenshot: screenshotUploadRes.metadata ? screenshotUploadRes.metadata : {},
            },
            images: { fullPage: screenshotUploadRes.key },
            hashedUrl: hashedLink,
        });
        // Close page
        //await page.close();
        await page.goto('about:blank');
        //Clear cache and cookies
        // await page.evaluate(() => {
        //     localStorage.clear();
        //     sessionStorage.clear();
        // });
        if (data.onCompleteFn) {
            logger.info('Callback function');
            data.onCompleteFn({
                success: 1,
                url: finalScrapingUrl,
                includeParams: data.includeParams,
                htmlUploadRes,
                screenshotUploadRes,
                cronHistoryId: data.cronHistoryId,
            });
        } else {
            logger.info('No callback');
        }
    } catch (error) {
        logger.error('Error in full scrape cluster', error);
        if (data?.onCompleteFn) {
            data.onCompleteFn({
                success: 0,
                error: 'Error in full scrape cluster',
                url: data?.url,
                includeParams: data?.includeParams,
                params: data?.params,
                cronHistoryId: data?.cronHistoryId,
            });
        }
        throw error;
    }
}
