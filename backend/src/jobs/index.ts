import prisma from '@/client';
import logger from '@/config/logger';
import { CronStatus, Timing } from '@prisma/client';
import { schedule } from 'node-cron';
import { v4 } from 'uuid';
import { linksService } from '@/services';
import { JobData } from '@/types/jobs';
import DailyJob from './daily/job';
// Import jobs
// Daily job to fetch links
schedule('0 0 * * *', async () => {
    logger.info('Running daily job to fetch links');
    // Fetch links
    // Start worker threads
    // Wait for all threads to finish
    // Save links to db
    // Save cron history

    // Generate uuid for cron history
    const uuid = v4();
    const jobData: JobData = {
        uuid,
        status: CronStatus.PENDING,
        startTime: new Date(),
        links: [],
    };
    // Fetch links from db
    const links = await linksService.fetchLinks(Timing.DAILY);
    jobData.links = links;
    await prisma.cronHistory.create({
        data: {
            status: CronStatus.PENDING,
            startTime: new Date(),
            data: jobData as object,
        },
    });
    // Start worker threads
    logger.info(`Starting worker threads for job ${uuid}`, jobData);
    DailyJob(jobData);
});
