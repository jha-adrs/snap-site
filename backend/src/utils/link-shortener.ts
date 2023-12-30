import logger from '@/config/logger';
import crypto from 'crypto';
// Creates a short link for a given URL to improve database indexing

/**
 *Returns an object containing hashed link and original link
 * @param link
 * @param length
 * @returns object
 */

interface HashedLink {
    hashedLink: string;
    originalLink: string;
}

const getHash = (link: string, length: number | undefined): Promise<HashedLink> => {
    return new Promise((resolve, reject) => {
        try {
            const hash = crypto.createHash('sha256');
            hash.update(link);
            const hashedLink = hash.digest('hex');
            if (length) resolve({ hashedLink: hashedLink.slice(0, length), originalLink: link });
            resolve({ hashedLink, originalLink: link });
        } catch (error) {
            logger.error(error);
            reject(error);
        }
    });
};

export default getHash;
