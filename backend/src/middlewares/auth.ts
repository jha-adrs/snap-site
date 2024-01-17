import { randomBytes } from 'crypto';

export function generateApiKeyAndSecret() {
    const apiKey = randomBytes(20).toString('hex');
    const apiSecret = randomBytes(40).toString('hex');
    // Store in db
    return { apiKey, apiSecret };
}
