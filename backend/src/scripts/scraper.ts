// Scrapes a given link and extracts data

import logger from '@/config/logger';
import { load } from 'cheerio';
import axios from 'axios';
import { isValidUrl } from '@/utils/urlUtils';
import prisma from '@/client';
import { writeFile } from 'fs';
import getHash from '@/utils/link-shortener';
/**
 * Type I-Full scrape, save everything on the page
 * Type II-Scrape only the required data, can be class,id or tag
 */
interface FullScrapeParams {
    url: string;
    priceElement: string | undefined;
    includeImages: boolean;
    includeVideos: boolean;
}
export async function fullScrape(scrapeData: FullScrapeParams) {
    //Scrape and save complete page
    logger.info(`Full scrape:`, scrapeData);
    if (!isValidUrl(scrapeData.url)) {
        logger.error('Invalid URL');
        throw new Error('Invalid URL');
    }
    const { data } = await axios.get(scrapeData.url);
    logger.info('Received URL data');
    const $ = load(data);
    const fullPage = $('html').html();
    //Save to html to file
    if (!fullPage) throw new Error('Error saving file');
    const { hashedLink } = await getHash(scrapeData.url, 6);
    //Save the html to a file using fs
    writeFile(`./${hashedLink}.html`, fullPage, (err) => {
        if (err) {
            logger.error(err);
            throw new Error('Error saving file');
        }
        logger.info('File saved');
    });
    return hashedLink;
}

//.corePrice_feature_div #celwidget data-feature-name->corePrice
// span.a-price, a-offscreen
interface SaveImagesParams {
    imageUrl: string | undefined;
    url: string; // the URL to which the image belongs
    hashedLink: string; // the hashed link to which the image belongs
    imageLocation: any; // TODO: Find a way to define the image location
    identifier: string; // the identifier of the image
}
interface SaveImagesResults {
    [key: string]: string; // key is the identifier and value is the image url
}
async function saveImages(data: SaveImagesParams[]): Promise<SaveImagesResults> {
    // Use S3 to upload images
    logger.info(`Saving images ${JSON.stringify(data)}`);
    return new Promise((resolve, reject) => {
        resolve({});
    });
}
