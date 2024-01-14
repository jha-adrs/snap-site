import prisma from '@/client';
import logger from '@/config/logger';
import { fullScrape, takeScreenshot } from '@/scripts/scraper';
import { fileService } from '@/services';
import catchAsync from '@/utils/catchAsync';
import getHash from '@/utils/link-shortener';
import pick from '@/utils/pick';
import getPrismaErrorMessage from '@/utils/prismaErrorHandler';
import { trackerValidation } from '@/validations';
import { User } from '@prisma/client';

const getLinks = catchAsync(async (req, res) => {
    logger.info(`Get links ${JSON.stringify(req.user)}`);
    // Get all links for a user
    const user = req.user as User;
    // TODO: Add pagination and search options sort order
    const query = pick(req.query, ['sortBy', 'sortOrder', 'limit', 'page', 'timing', 'name']);
    const links = await prisma.userLinkMap.findMany({
        where: {
            userId: user.id,
        },
        select: {
            link: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    logger.info(
        `Links ${JSON.stringify(links)} and query ${JSON.stringify(
            query
        )} for user ${JSON.stringify(user)}`
    );
    return res.status(200).send(links);
});

const addLink = catchAsync(async (req, res) => {
    try {
        // Add a link for a user
        const user = req.user as User;
        if (!user || !user.id) {
            return res.status(401).send('Unauthorized');
        }
        //const data = pick(req.body, ['url', 'trackingImage', 'timing', 'assignedName', 'tags']);
        const {
            body: { url, trackingImage, timing, assignedName, tags },
        } = await trackerValidation.addLink.parseAsync(req);
        //Extract domain from url
        if (!url) {
            return res.status(400).send('Bad request');
        }
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        const hashedURL = await getHash(url as string, 6);
        const scrapeParams = {
            url: urlObj.href,
            hostname: urlObj.hostname,
            priceElement: undefined,
            includeImages: trackingImage,
        };
        const fileResponse = await fullScrape(scrapeParams);
        //const ssResponse = await takeScreenshot({ url, hostname: urlObj.hostname });
        if (fileResponse.success === 0 || !fileResponse.fileResponse) {
            return res.status(500).send({ message: fileResponse.error });
        }
        const fileInfo = fileResponse.fileResponse;
        const [createRes] = await prisma.$transaction(async (prisma) => {
            const domainRes = await prisma.domains.upsert({
                where: {
                    domain,
                },
                create: {
                    domain,
                },
                update: {
                    domain,
                },
            });
            const linkRes = await prisma.links.create({
                data: {
                    url: url,
                    trackingImage: trackingImage,
                    timing: timing,
                    domainId: domainRes.id,
                    hashedUrl: hashedURL.hashedLink,
                },
            });

            const userLinkMapRes = await prisma.userLinkMap.create({
                data: {
                    userId: user.id,
                    linkId: linkRes.id,
                    assignedName: assignedName,
                    tags: JSON.stringify(tags),
                },
            });
            const linkDataRes = await prisma.linkData.create({
                data: {
                    status: 'SUCCESS',
                    hashedUrl: fileInfo.metadata.hashedUrl,
                    objectKey: fileInfo.key,
                    metadata: fileInfo.metadata,
                },
            });

            return [userLinkMapRes, linkRes, domainRes, linkDataRes];
        });

        logger.info(`Added link ${JSON.stringify(createRes)}`);
        return res.status(200).send(createRes);
    } catch (error) {
        logger.error(`Error adding link `, {
            prismaErr: getPrismaErrorMessage(error, null),
            error,
        });
        res.status(500).send('Internal server error');
    }
});

const getLink = catchAsync(async (req, res) => {
    logger.info(`Get link ${JSON.stringify(req.params)}`);
    const { params } = await trackerValidation.getLink.parseAsync(req);
    const link = await prisma.linkData.findFirst({
        where: {
            hashedUrl: params.id,
        },
    });
    logger.info(`Link ${JSON.stringify(link)}`);
    if (!link) {
        return res.status(404).send({ message: 'Link not found' });
    }
    //Get from S3
    const file = await fileService.getS3Object({
        key: link.objectKey,
        contentEncoding: 'text/html',
    });
    //Send the file as response
    return res.status(200).send(file);
});

const getLinkHistory = catchAsync(async (req, res) => {
    logger.info(`Get link history `);
    const { params } = await trackerValidation.getLinkHistory.parseAsync(req);
    let url = '';
    if (params.type === 'ORIGINAL') {
        url = (await getHash(url, 6)).hashedLink;
    } else {
        url = params.url;
    }
    logger.info('Searching for link', { url });
    const links = await prisma.linkData.findMany({
        where: {
            hashedUrl: url,
            status: 'SUCCESS',
        },
        select: {
            status: true,
            hashedUrl: true,
            objectKey: true, //TODO: Review if sensitive
            metadata: true,
        },
    });
    logger.info(`Links available`, { links });
    if (!links || links.length === 0) {
        return res.status(404).send({ message: 'No tracking history found' });
    }
    return res.status(200).json({
        success: 1,
    });
});

export default {
    getLinks,
    addLink,
    getLink,
    getLinkHistory,
};
