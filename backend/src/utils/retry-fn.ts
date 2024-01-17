// Function that retries a function until it succeeds or the max number of retries is reached
// NEEDS TO BE TESTED
import logger from '@/config/logger';

interface RetryFnParams {
    fn: (fnParams: any) => Promise<any>;
    fnParams?: any;
    retries?: number;
    interval?: number;
}
function retryFn({ fn, fnParams, retries = 3, interval = 1 }: RetryFnParams): Promise<any> {
    const maxRetries = retries < 20 ? retries : 20;
    logger.info(`Starting retry fn`);
    return new Promise(async (resolve, reject) => {
        while (retries > 0) {
            try {
                const response = await fn(fnParams);
                resolve(response);
            } catch (error) {
                retries--;
                if (retries === 0 || retries < maxRetries) {
                    reject({ error, retries, message: 'Max retries reached' });
                }
                logger.info(`Retrying ${retries} more times`);
                logger.error(`Error in retryFn`, { error });
                await new Promise((resolve) => setTimeout(resolve, interval * 1000));
            }
        }
    });
}
export default retryFn;
