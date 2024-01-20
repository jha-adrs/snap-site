import config from '@/config/config';
import logger from '@/config/logger';
import {
    GetObjectCommand,
    ListBucketsCommand,
    ListObjectsCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { links_timing } from '@prisma/client';

const client = new S3Client({
    region: config.aws.region,
    credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
    },
});

const listBuckets = async () => {
    const command = new ListBucketsCommand({});
    const response = await client.send(command);
    console.log(response);
    return response;
};

export interface UploadFileParams {
    fileName: string;
    file: Buffer;
    domainName: string;
    originalUrl: string;
    hashedUrl: string;
    fileType?: string;
    timestamp?: number;
    timing?: links_timing;
    timezone?: string;
}

const uploadFile = async ({
    domainName,
    file,
    hashedUrl,
    originalUrl,
    fileType,
    timestamp,
    timezone,
    timing,
    fileName,
}: UploadFileParams) => {
    try {
        logger.info('Uploading File', { domainName, hashedUrl, originalUrl, fileType });
        if (!fileType) {
            const type = 'text/html'; // TODO: Review this
            fileType = type ? 'html' : 'bin';
        }
        if (!timestamp) timestamp = Date.now();
        const key = `${timing}/${domainName}/${hashedUrl}/${timestamp}/${fileName}.${fileType}`;
        const metadata = {
            originalUrl,
            hashedUrl,
            timestamp: timestamp.toString(),
            timezone: timezone ? timezone : Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
        const command = new PutObjectCommand({
            Key: key,
            ACL: 'bucket-owner-read',
            Bucket: config.aws.s3BucketName,
            //ContentType: 'text/html',
            Body: file,
            StorageClass: 'INTELLIGENT_TIERING',
            Metadata: metadata,
        });
        const response = await client.send(command);
        return { key, metadata, response };
    } catch (error) {
        logger.error('Error in HTML File upload', error);
        throw new Error('Error in HTML File upload');
    }
};

interface ListS3ObjectsParams {
    prefix: string;
    bucketName?: string;
}
// Get all the domains/folders in the S3 bucket
const listS3Objects = async ({ prefix, bucketName }: ListS3ObjectsParams) => {
    try {
        logger.info('Getting S3 domains', { prefix, bucketName });
        const command = new ListObjectsCommand({
            Bucket: config.aws.s3BucketName,
            Prefix: prefix,
        });
        const response = await client.send(command);
        logger.info('S3 domains', { response });
        return response;
    } catch (error) {
        logger.error('Error in getting S3 domains', error);
        throw new Error('Error in getting S3 domains');
    }
};

interface GetS3ObjectParams {
    key: string;
    contentEncoding?: string;
    bucketName?: string;
}
// Get the object from S3
const getS3Object = async ({ key, bucketName, contentEncoding }: GetS3ObjectParams) => {
    try {
        logger.info('Getting S3 object', { key });
        if (!bucketName) bucketName = config.aws.s3BucketName;
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: key,
            ResponseContentType: contentEncoding,
        });
        const response = await client.send(command);
        logger.info('S3 object', { response });
        return response;
    } catch (error) {
        logger.error('Error in getting S3 object', error);
        return null;
    }
};

async function getPresignedURL(key: string) {
    try {
        logger.info('Getting presigned URL');
        const command = new GetObjectCommand({ Bucket: config.aws.s3BucketName, Key: key });
        return {
            key,
            url: await getSignedUrl(client, command, { expiresIn: 86400 }),
        };
    } catch (error) {
        logger.error('Error in getting presigned URL', error);
        return null;
    }
}

export default {
    listBuckets,
    uploadFile,
    listS3Objects,
    getS3Object,
    getPresignedURL,
};
