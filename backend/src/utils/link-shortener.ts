import crypto from 'crypto';
// Creates a short link for a given URL to improve database indexing

/**
 *Returns an object containing hashed link and original link
 * @param link
 * @param length
 * @returns object
 */

const getHashedLink = async (link: string, length: number | undefined) => {
    const hash = crypto.createHash('sha256');
    hash.update(link);
    const hashedLink = hash.digest('hex');
    if (length) return { hashedLink: hashedLink.slice(0, length), originalLink: link };
    return { hashedLink, originalLink: link };
};

export default {
    getHashedLink,
};
