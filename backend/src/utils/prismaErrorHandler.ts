import logger from '@/config/logger';

// JSON object with error codes and reasons
interface ErrorMessages {
    [key: string]: string;
}
const errorMessages: ErrorMessages = {
    // Prisma Client Known Request Errors
    P2000: "The provided value for the column is too long for the column's type.",
    P2001: 'The record searched for in the where condition does not exist.',
    P2002: 'Unique constraint failed on the specified target.',
    P2003: 'Foreign key constraint failed on the specified field.',
    P2004: 'A constraint failed on the database.',
    P2005: "The value stored in the database for the field is invalid for the field's type.",
    P2006: 'The provided value for the field is not valid.',
    P2007: 'Data validation error.',
    P2008: 'Failed to parse the query at the specified position.',
    P2009: 'Failed to validate the query at the specified position.',
    P2010: 'Raw query failed. Code and Message are provided.',
    P2011: 'Null constraint violation on the specified constraint.',
    P2012: 'Missing a required value at the specified path.',
    P2013: 'Missing the required argument for the field on the specified object.',
    P2014: 'The change would violate the required relation between the specified models.',
    P2015: 'A related record could not be found.',
    P2016: 'Query interpretation error.',
    P2017: 'The records for relation between the specified models are not connected.',
    P2018: 'The required connected records were not found.',
    P2019: 'Input error.',
    P2020: 'Value out of range for the type.',
    P2021: 'The table does not exist in the current database.',
    P2022: 'The column does not exist in the current database.',
    P2023: 'Inconsistent column data.',
    P2024: 'Timed out fetching a new connection from the connection pool.',
    P2025: 'An operation failed because it depends on one or more records that were required but not found.',
    P2026: "The current database provider doesn't support a feature that the query used.",
    P2027: 'Multiple errors occurred on the database during query execution.',
    P2028: 'Transaction API error.',
    P2030: 'Cannot find a fulltext index to use for the search.',
    P2031: 'Prisma needs to perform transactions, which requires your MongoDB server to be run as a replica set.',
    P2033: 'A number used in the query does not fit into a 64 bit signed integer.',
    P2034: 'Transaction failed due to a write conflict or a deadlock.',

    // Prisma Client Unknown Request Error
    P5000: 'This request could not be understood by the server.',
    P5001: 'This request must be retried.',
    P5002: 'The datasource provided is invalid.',
    P5003: 'Requested resource does not exist.',
    P5004: 'The feature is not yet implemented.',
    P5005: 'Schema needs to be uploaded.',
    P5006: 'Unknown server error.',
    P5007: 'Unauthorized, check your connection string.',
    P5008: 'Usage exceeded, retry again later.',
    P5009: 'Request timed out.',
    P5010: 'Cannot fetch data from service.',
    P5011: 'Request parameters are invalid.',
    P5012: 'Engine version is not supported.',
    P5013: 'Engine not started: healthcheck timeout.',
    P5014: 'Unknown engine startup error.',
    P5015: 'Interactive transaction error.',
    P5016: 'Database resets failed, Migrate could not clean up the database.',
    P5017: 'Migration could not be found.',
    P5018: 'A migration failed to apply.',
    P5019: 'Datasource provider specified in your schema does not match the one specified in the migration_lock.toml.',
    P5020: 'Automatic creation of shadow databases is disabled on Azure SQL.',
    P5021: 'Foreign keys cannot be created on this database.',
    P5022: 'Direct execution of DDL SQL statements is disabled on this database.',
    P4000: 'Introspection operation failed to produce a schema file.',
    P4001: 'The introspected database was empty.',
    P4002: 'The schema of the introspected database was inconsistent.',

    // Prisma Client Initialization Errors
    P1000: 'Authentication failed against the database server.',
    P1001: "Can't reach database server.",
    P1002: 'The database server was reached but timed out.',
    P1003: 'Database does not exist.',
    P1008: 'Operations timed out.',
    P1009: 'Database already exists.',
    P1010: 'User was denied access on the database.',
    P1011: 'Error opening a TLS connection.',
    P1012: 'The provided error details.',
    P1013: 'The provided database string is invalid.',
    P1014: 'The underlying kind for model does not exist.',
    P1015: 'Prisma schema is using unsupported features for the version of the database.',
    P1016: 'Raw query had an incorrect number of parameters.',
    P1017: 'Server has closed the connection.',
    P3000: 'Failed to create database.',
    P3001: 'Migration possible with destructive changes and possible data loss.',
    P3002: 'The attempted migration was rolled back.',
    P3003: 'The format of migrations changed.',
    P3004: 'The database is a system database, it should not be altered with prisma migrate.',
    P3005: 'The database schema is not empty.',
    P3006: 'Migration failed to apply cleanly to the shadow database.',
    P3007: 'Some of the requested preview features are not yet allowed in schema engine.',
    P3008: 'The migration is already recorded as applied in the database.',
    P3009: 'Migrate found failed migrations in the target database.',
    P3010: 'The name of the migration is too long.',
    P3011: 'Migration cannot be rolled back because it was never applied to the database.',
    P3012: 'Migration cannot be rolled back because it is not in a failed state.',
    P3013: 'Datasource provider arrays are no longer supported in migrate.',
    P3014: 'Prisma Migrate could not create the shadow database.',
    P3015: 'Could not find the migration file.',
    P3016: 'Fallback method for database resets failed.',
    P3017: 'Migration could not be found.',
    P3018: 'A migration failed to apply.',
    P3019: 'Datasource provider specified in your schema does not match the one specified in the migration_lock.toml.',
    P3020: 'Automatic creation of shadow databases is disabled on Azure SQL.',
    P3021: 'Foreign keys cannot be created on this database.',
    P3022: 'Direct execution of DDL SQL statements is disabled on this database.',

    // Data Proxy Errors
    P6000: 'This request could not be understood by the server.',
    P6001: 'This request must be retried.',
    P6002: 'The datasource provided is invalid.',
    P6003: 'Requested resource does not exist.',
    P6004: 'The feature is not yet implemented.',
    P6005: 'Schema needs to be uploaded.',
    P6006: 'Unknown server error.',
    P6007: 'Unauthorized, check your connection string.',
    P6008: 'Usage exceeded, retry again later.',
    P6009: 'Request timed out.',
    P6010: 'Cannot fetch data from service.',
    P6011: 'Request parameters are invalid.',
    P6012: 'Engine version is not supported.',
    P6013: 'Engine not started: healthcheck timeout.',
    P6014: 'Unknown engine startup error.',
    P6015: 'Interactive transaction error.',
    P6016: 'Database resets failed, Migrate could not clean up the database.',
    P6017: 'Migration could not be found.',
    P6018: 'A migration failed to apply.',
    P6019: 'Datasource provider specified in your schema does not match the one specified in the migration_lock.toml.',
    P6020: 'Automatic creation of shadow databases is disabled on Azure SQL.',
    P6021: 'Foreign keys cannot be created on this database.',
    P6022: 'Direct execution of DDL SQL statements is disabled on this database.',
}; // End of errorMessages

// Function to get error message based on error code

function getPrismaErrorMessage(err: any, errorCode: any): string | null {
    try {
        const code: any = errorCode
            ? errorCode
            : err?.code
            ? err.code
            : err?.errorCode
            ? err.errorCode
            : 'P5000';
        const errorMessage = errorMessages[code];
        logger.error(`Prisma error code ${code} error message ${errorMessage}`);
        return errorMessage ? errorMessage : null;
    } catch (error) {
        logger.error(`Error getting error message ${JSON.stringify(error)} type ${typeof error}`);
        return null;
    }
}

export default getPrismaErrorMessage;
