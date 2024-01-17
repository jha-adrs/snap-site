import config from '@/config/config';
import { z } from 'zod';

export const startCron = z.object({
    timing: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
});

export const singleLinkCron = z.object({
    timing: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
    hash: z.string().length(config.scraper.hashLength),
});

export const getPresignedURL = z.object({
    hash: z.string().length(config.scraper.hashLength),
});

export const getDomainObjects = z
    .object({
        timing: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
        url: z.string().url().optional(),
        domain: z.string().optional(),
        hash: z.string().length(config.scraper.hashLength),
    })
    .refine((data) => Boolean(data.url) !== Boolean(data.domain), {
        message: 'Either url or domain should be present',
    });
export const getMultiplePresignedURLs = z.object({
    keys: z.array(z.string()),
});

export default {
    startCron,
    singleLinkCron,
    getPresignedURL,
    getDomainObjects,
};
