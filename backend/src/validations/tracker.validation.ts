import { z } from 'zod';

export const startCron = z.object({
    timing: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
});

export default {
    startCron,
};
