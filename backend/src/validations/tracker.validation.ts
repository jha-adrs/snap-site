import { z } from 'zod';

const addDomain = z.object({
    body: z.object({
        domain: z.string().url(),
    }),
});

const addLink = z.object({
    body: z.object({
        url: z.string().url(),
        trackingImage: z.boolean(),
        timing: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
        assignedName: z.string().min(1).optional(),
        tags: z.array(z.string()).optional(),
    }),
});

const getLinks = z.object({
    query: z.object({
        name: z.string().min(1).optional(),
        timing: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional(),
        sortBy: z.enum(['createdAt', 'name']).optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
        page: z.coerce.number().int().min(1).optional(),
    }),
});

const getLink = z.object({
    params: z.object({
        id: z.string().min(1),
        date: z.string().min(1).optional(),
    }),
});

const getLinkHistory = z.object({
    params: z.object({
        url: z.string().min(1),
        type: z.enum(['HASHED', 'ORIGINAL']).default('HASHED').optional(),
    }),
});

export default {
    addDomain,
    addLink,
    getLinks,
    getLink,
    getLinkHistory,
};
