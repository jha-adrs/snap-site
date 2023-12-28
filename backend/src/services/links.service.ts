// Responsible for handling all the logic related to the links

import prisma from '@/client';
import { LinkList } from '@/types/jobs';
import { Timing } from '@prisma/client';

const fetchLinks = async (timing: Timing): Promise<LinkList[]> => {
    const links = await prisma.links.findMany({
        where: {
            timing,
            isActive: true,
        },
        select: {
            name: true,
            url: true,
            isActive: true,
            timing: true,
            hasConfigChanged: true,
            domainId: true,
            domain: true,
        },
    });
    return links;
};

export default {
    fetchLinks,
};
