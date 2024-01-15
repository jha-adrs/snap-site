// Responsible for handling all the logic related to the links

import prisma from '@/client';
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

export default {
    fetchLinks,
};
