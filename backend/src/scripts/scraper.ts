// Scrapes a given link and extracts data

import logger from '@/config/logger';
import { load } from 'cheerio';
import axios, { AxiosError } from 'axios';
import { isValidUrl } from '@/utils/urlUtils';
import getHash from '@/utils/link-shortener';
import { fileService } from '@/services';
import { UploadHTMLFileParams } from '@/services/file.service';
import config from '@/config/config';
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
        const fileUploadParams: UploadHTMLFileParams = {
            fileName: `${hashedLink}.html`,
            file: Buffer.from(fullPage),
            domainName: scrapeData.hostname,
            originalUrl: originalLink,
            hashedUrl: hashedLink,
        };
        const fileResponse = await fileService.uploadHTMLFile(fileUploadParams);
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
