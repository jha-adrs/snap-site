import config from '@/config/config';
import { z } from 'zod';

export const startCron = z.object({
    timing: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
});

export const singleLinkCron = z.object({
    timing: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
    hash: z.string().length(config.scraper.hashLength),
});

export default {
    startCron,
    singleLinkCron,
};
