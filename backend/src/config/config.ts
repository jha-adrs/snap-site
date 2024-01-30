import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.join(process.cwd(), '.env') });

// Define env vars schema
const envVarsSchema = z.object({
    NODE_ENV: z
        .enum(['production', 'development', 'test'])
        .refine((value) => value !== undefined, { message: 'NODE_ENV is required' }),
    PORT: z.coerce.number().default(8000),
    JWT_SECRET: z.string().default('secret').describe('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: z.coerce
        .number()
        .default(30)
        .describe('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: z.coerce
        .number()
        .default(30)
        .describe('days after which refresh tokens expire'),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: z.coerce
        .number()
        .default(10)
        .describe('minutes after which reset password token expires'),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: z.coerce
        .number()
        .default(10)
        .describe('minutes after which verify email token expires'),
    SMTP_HOST: z.string().describe('server that will send the emails'),
    SMTP_PORT: z.coerce.number().describe('port to connect to the email server'),
    SMTP_USERNAME: z.string().describe('username for email server'),
    SMTP_PASSWORD: z.string().describe('password for email server'),
    EMAIL_FROM: z.string().describe('the from field in the emails sent by the app'),
    REDIS_HOST: z.string().default('localhost').describe('redis host'),
    REDIS_PORT: z.coerce.number().default(6379).describe('redis port'),
    REDIS_PASSWORD: z.string().describe('redis password'),
    AWS_ACCESS_KEY_ID: z.string().describe('AWS access key ID'),
    AWS_SECRET_ACCESS_KEY: z.string().describe('AWS secret access key'),
    AWS_S3_BUCKET_NAME: z.string().describe('AWS S3 bucket name'),
    AWS_BUCKET_REGION: z.string().default('us-east-1').describe('AWS S3 bucket region'),
    HASHLENGTH: z.coerce.number().default(5).describe('Hash length for the shortened URL'),
    API_SECRET: z.string().describe('API secret key from nextJS app'),
    SLACK_WEBHOOK_URL: z.string().describe('Slack webhook URL'),
});

// Validate env vars
const envVars = envVarsSchema.safeParse(process.env);

if (!envVars.success) {
    throw new Error(`Config validation error: ${envVars.error.message}`);
}

export default {
    env: envVars.data.NODE_ENV,
    port: envVars.data.PORT,
    jwt: {
        secret: envVars.data.JWT_SECRET,
        accessExpirationMinutes: envVars.data.JWT_ACCESS_EXPIRATION_MINUTES,
        refreshExpirationDays: envVars.data.JWT_REFRESH_EXPIRATION_DAYS,
        resetPasswordExpirationMinutes: envVars.data.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
        verifyEmailExpirationMinutes: envVars.data.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
    },
    email: {
        smtp: {
            host: envVars.data.SMTP_HOST,
            port: envVars.data.SMTP_PORT,
            auth: {
                user: envVars.data.SMTP_USERNAME,
                pass: envVars.data.SMTP_PASSWORD,
            },
        },
        from: envVars.data.EMAIL_FROM,
    },
    redis: {
        host: envVars.data.REDIS_HOST,
        port: envVars.data.REDIS_PORT,
        password: envVars.data.REDIS_PASSWORD,
    },
    aws: {
        accessKeyId: envVars.data.AWS_ACCESS_KEY_ID,
        secretAccessKey: envVars.data.AWS_SECRET_ACCESS_KEY,
        s3BucketName: envVars.data.AWS_S3_BUCKET_NAME,
        region: envVars.data.AWS_BUCKET_REGION,
    },
    scraper: {
        hashLength: envVars.data.HASHLENGTH,
        API_SECRET: envVars.data.API_SECRET,
    },
    slack: {
        webhookURL: envVars.data.SLACK_WEBHOOK_URL,
    },
};
