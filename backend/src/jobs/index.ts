import {schedule} from 'node-cron';

// Minutely cron job
schedule('* * * * *', () => {
    console.log('This job runs every minute!');
});
