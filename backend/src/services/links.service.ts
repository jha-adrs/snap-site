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
            name: true,
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
    objectKey: string;
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
        if (!data.objectKey || !data.metadata || !data.images) {
            throw new Error('Invalid data');
        }

        await prisma.linkdata.create({
            data: {
                objectKey: data.objectKey,
                metadata: data.metadata,
                status: 'SUCCESS',
                images: data.images,
                updatedAt: new Date(),
                hashedUrl: data.hashedUrl,
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
