// Responsible for handling all the logic related to the links

import prisma from '@/client';
import logger from '@/config/logger';
import { links_timing } from '@prisma/client';

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

export default {
    fetchLinks,
    addLinkData,
};
