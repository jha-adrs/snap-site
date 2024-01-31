import config from '@/config/config';
import logger from '@/config/logger';
import axios from 'axios';

// Handle Slack
export const postToSlack = async (text: string) => {
    try {
        const res = await axios.post(config.slack.webhookURL, {
            text: `:robot_face:  ${text}\n Env:(${config.env})`,
        });
        if (res.status === 200) {
            logger.info('Slack message sent', { text });
        }
    } catch (error) {
        logger.error('Error in sending slack message', error);
    }
};
