import config from '@/config/config';
import logger from '@/config/logger';
import { createClient } from 'redis';

class Redis {
    redisClient: ReturnType<typeof createClient>;
    constructor() {
        const client = createClient({
            username: 'default',
            password: config.redis.password,
            socket: {
                host: config.redis.host,
                port: config.redis.port,
            },
        });
        client.on('error', (err) => {
            console.error('Redis Error', err);
            throw new Error(err);
        });
        client.connect();
        this.redisClient = client;
    }
    async addKey(key: string, value: any, ttl?: number) {
        logger.info('Adding key value', { key, value });
        const added = await this.redisClient.set(key, value);
        if (ttl) {
            await this.redisClient.expire(key, ttl);
        }
        return added;
    }
    async getKey(key: string) {
        return await this.redisClient.get(key);
    }
    async deleteKey(key: string) {
        logger.warn('Deleting key', key);
        return await this.redisClient.del(key);
    }
}
export default new Redis();

export const redisBullConfig = {
    redis: {
        host: config.redis.host,
        port: config.redis.port,
    },
};
