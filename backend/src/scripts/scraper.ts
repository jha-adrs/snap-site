// Scrapes a given link and extracts data

import logger from '@/config/logger';
import { load } from 'cheerio';
import axios, { AxiosError } from 'axios';
import { isValidUrl } from '@/utils/urlUtils';
import getHash from '@/utils/link-shortener';
import { fileService } from '@/services';
import { UploadFileParams } from '@/services/file.service';
import config from '@/config/config';
import puppeteer from 'puppeteer-core';
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
                fileName: `${hashedLink}-${Date.now()}.png`,
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
