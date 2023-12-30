import prisma from '@/client';
import logger from '@/config/logger';
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
        const { body } = await trackerValidation.addLink.parseAsync(req);
        const data = body;
        //Extract domain from url
        if (!data.url) {
            return res.status(400).send('Bad request');
        }
        const domain = new URL(data.url as string).hostname;
        const hashedURL = await getHash(data.url as string, 6);
        logger.info(
            `Add link ${JSON.stringify(data)} for user ${JSON.stringify(
                user
            )} hashedURL ${JSON.stringify(hashedURL.hashedLink)}`
        );
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
                    url: data.url,
                    trackingImage: data.trackingImage,
                    timing: data.timing,
                    domainId: domainRes.id,
                    hashedUrl: hashedURL.hashedLink,
                },
            });

            const userLinkMapRes = await prisma.userLinkMap.create({
                data: {
                    userId: user.id,
                    linkId: linkRes.id,
                    assignedName: data.assignedName,
                    tags: JSON.stringify(data.tags),
                },
            });

            return [userLinkMapRes, linkRes, domainRes];
        });

        logger.info(`Added link ${JSON.stringify(createRes)}`);
        return res.status(200).send(createRes);
    } catch (error) {
        logger.error(`Error adding link ${JSON.stringify(error)}`);
        getPrismaErrorMessage(error, null);
        return res.status(500).send('Internal server error');
    }
});

export default {
    getLinks,
    addLink,
};
