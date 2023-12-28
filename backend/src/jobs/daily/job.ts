import logger from '@/config/logger';
import { JobData } from '@/types/jobs';

const DailyJob = async (jobData: JobData) => {
    const { links } = jobData;
    logger.info(`Starting worker threads for job ${jobData.uuid}`, jobData);
    return links;
};

export default DailyJob;
