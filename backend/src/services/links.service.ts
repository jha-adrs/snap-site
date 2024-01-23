// Responsible for handling all the logic related to the links

import prisma from '@/client';
import logger from '@/config/logger';
import { LinkDataKeys } from '@/types/response';
import { trackerValidation } from '@/validations';
import { links_timing } from '@prisma/client';
import fileService from './file.service';

async function fetchLinks(timing: links_timing) {
    const links = await prisma.links.findMany({
        where: {
            timing: timing,
            isActive: true,
        },
        select: {
            url: true,
            isActive: true,
            timing: true,
            hasConfigChanged: true,
            domainId: true,
            domains: true,
        },
    });
    return links;
}

interface AddLinkDataParams {
    htmlObjectKey: string;
    screenshotKey: string;
    thumbnailKey: string;
    timing: links_timing;
    metadata: {
        html: any;
        screenshot: any;
    };
    images: {
        fullPage: string;
    };
    hashedUrl: string;
}

async function addLinkData(data: AddLinkDataParams) {
    try {
        logger.info('Adding link data', data);
        if (!data.htmlObjectKey || !data.screenshotKey || !data.metadata || !data.images) {
            throw new Error('Invalid data');
        }

        await prisma.linkdata.create({
            data: {
                metadata: data.metadata,
                status: 'SUCCESS',
                images: data.images,
                updatedAt: new Date(),
                hashedUrl: data.hashedUrl,
                htmlObjectKey: data.htmlObjectKey,
                screenshotKey: data.screenshotKey,
                thumbnailKey: data.thumbnailKey,
                timing: data.timing,
            },
        });
    } catch (error) {
        logger.error('Error in adding link data', error);
        throw new Error('Error in adding link data');
    }
}

const getMultiplePresignedURLService = (req: any) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { url, hashedUrl, timing, keys } =
                trackerValidation.getMultiplePresignedURLs.parse(req.body);
            logger.info('Getting keys', { keys, url, hashedUrl, timing });
            const presignedURLs: LinkDataKeys[] = [];
            for (const key of keys) {
                const { htmlObjectKey, screenshotObjectKey, thumbnailObjectKey } = key;
                const urls = await Promise.all([
                    fileService.getPresignedURL(`${htmlObjectKey}`),
                    fileService.getPresignedURL(`${screenshotObjectKey}`),
                    fileService.getPresignedURL(`${thumbnailObjectKey}`),
                ]);
                logger.info('Got presigned urls');
                if (urls.length === 3 && urls[0] && urls[1] && urls[2]) {
                    presignedURLs.push(
                        {
                            key: htmlObjectKey,
                            url: urls[0].url,
                        },
                        {
                            key: screenshotObjectKey,
                            url: urls[1].url,
                        },
                        {
                            key: thumbnailObjectKey,
                            url: urls[2].url,
                        }
                    );
                } else {
                    logger.error('Error in getting multiple presigned urls', urls);
                }
            }

            resolve(presignedURLs);
        } catch (error) {
            logger.error('Error in getMultiplePresignedURLService', error);
            reject(error);
        }
    });
};

export default {
    fetchLinks,
    addLinkData,
    getMultiplePresignedURLService,
};
