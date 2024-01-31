import config from '@/config/config';
import logger from '@/config/logger';
import Bull from 'bull';
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

        client.connect();
        client.on('error', (err) => {
            console.error('Redis Error', err);
            throw new Error(err);
        });
        client.on('connect', () => {
            client.set('foo', 'bar');
            logger.info('Connected to redis');
        });
        this.redisClient = client;
    }
    async addKey(key: string, value: any, ttl?: number) {
        logger.info('Adding key value', { key, value });
        if (!this.redisClient || !this.redisClient.isOpen) {
            logger.info('Redis client is closed');
            await this.redisClient.connect();
        } else {
            logger.info('Redis client is open');
        }
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

export const redisBullConfig: Bull.QueueOptions = {
    redis: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
    },
    settings: {
        stalledInterval: 30000,
        guardInterval: 5000,
    },
};
