import express from 'express';
import trackerRoute from './tracker.route';
//import config from '@/config/config';

const router = express.Router();

const defaultRoutes: any[] = [
    {
        path: '/tracker',
        route: trackerRoute,
    },
];

// const devRoutes = [
//     // routes available only in development mode
// ];

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

// /* istanbul ignore next */
// if (config.env === 'development') {
//     devRoutes.forEach((route) => {
//         router.use(route.path, route.route);
//     });
// }

export default router;
