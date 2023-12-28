import logger from '@/config/logger';
import { JobData } from '@/types/jobs';

const DailyJob = async (jobData: JobData): Promise<void> => {
    logger.info(`Starting worker threads for job ${jobData.uuid}`, jobData);
    // Start worker threads
};

export default DailyJob;
