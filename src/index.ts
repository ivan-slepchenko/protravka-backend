import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import log4js from 'log4js';
import fs from 'fs';
import path from 'path';
import { version } from '../package.json';
import cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';
import cron from 'node-cron';
import { Order } from './models/Order';
import { ProductDetail } from './models/ProductDetail';
import { Operator } from './models/Operator';
import { Crop } from './models/Crop';
import { Variety } from './models/Variety';
import { Product } from './models/Product';
import { TkwMeasurement } from './models/TkwMeasurement';
import { OrderExecution } from './models/OrderExecution';
import { ProductExecution } from './models/ProductExecution';
import { OrderRecipe } from './models/OrderRecipe';
import { ProductRecipe } from './models/ProductRecipe';
import { checkAndCreateTkwMeasurements } from './daemon/TkwMeasurementDaemon';
import orderRoutes from './routes/orderRoutes';
import operatorRoutes from './routes/operatorRoutes';
import cropRoutes from './routes/cropRoutes';
import productRoutes from './routes/productRoutes';
import authenticationRoutes from './routes/authenticationRoutes';
import executionRoutes from './routes/executionRoutes';
import cleanupRoutes from './routes/cleanupRoutes';
import { Company } from './models/Company';

dotenv.config({ path: '.env' });

export interface FeatureFlags {
    useLab: boolean;
}

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT!),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    migrations: ['dist/migrations/*.js'],
    migrationsTableName: 'migrations',
    entities: [
        Order,
        ProductDetail,
        Operator,
        Crop,
        Variety,
        Product,
        TkwMeasurement,
        OrderExecution,
        ProductExecution,
        OrderRecipe,
        ProductRecipe,
        Company,
    ],
    synchronize: true,
});

log4js.configure({
    appenders: {
        file: {
            type: 'dateFile',
            filename: 'logs/app.log',
            pattern: '.yyyy-MM-dd',
            compress: true,
        },
        console: { type: 'console' },
    },
    categories: { default: { appenders: ['file', 'console'], level: 'info' } },
});

export const logger = log4js.getLogger();
logger.level = 'debug';

logger.info('Version:', version);

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
    origin: [/^http:\/\/localhost(:\d+)?$/, /\.azurecontainerapps\.io$/, 'https://teravix.tech'],
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' })); // Increase payload size limit for JSON
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Increase payload size limit for URL-encoded data
app.use(cookieParser());

app.use((req, _, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

app.get('/', (_, res) => {
    res.send(`Protravka Backend. Version: ${version}`);
});

app.get('/api/logs', (req, res) => {
    const logFilePath = path.join(__dirname, '../logs/app.log');
    fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) {
            logger.error('Failed to read log file:', err);
            return res.status(500).json({ error: 'Failed to read log file' });
        }
        res.type('text/plain').send(data);
    });
});

app.use('/api/orders', orderRoutes);
app.use('/api/operators', operatorRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth', authenticationRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/cleanup', cleanupRoutes);

if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY ||
    !process.env.FIREBASE_STORAGE_BUCKET ||
    !process.env.DB_HOST ||
    !process.env.DB_PORT ||
    !process.env.DB_USERNAME ||
    !process.env.DB_PASSWORD ||
    !process.env.DB_NAME
) {
    console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
    console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
    console.log('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY);
    console.log('FIREBASE_STORAGE_BUCKET:', process.env.FIREBASE_STORAGE_BUCKET);

    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_PORT:', process.env.DB_PORT);
    console.log('DB_USERNAME:', process.env.DB_USERNAME);
    console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
    console.log('DB_NAME:', process.env.DB_NAME);

    throw new Error('Missing required environment variables. See logs above.');
}

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        logger.info(`Server is running on port ${port}`);
        logger.debug(`DB_HOST: ${process.env.DB_HOST}`);
        logger.debug(`DB_PORT: ${process.env.DB_PORT}`);
        logger.debug(`DB_USERNAME: ${process.env.DB_USERNAME}`);
        logger.debug(`DB_PASSWORD: ${process.env.DB_PASSWORD}`);
        logger.debug(`DB_NAME: ${process.env.DB_NAME}`);
        AppDataSource.initialize()
            .then(async () => {
                logger.info('Database connected');
                await checkAndCreateTkwMeasurements();
                console.log('Checked and created TKW measurements on startup after 10 seconds.');
            })
            .catch((err: any) => logger.error('Unable to connect to the database:', err));
    });
}

const cronSchedule = '*/1 * * * *'; //process.env.TS_NODE_DEV === 'true' ? '*/1 * * * *' : '*/10 * * * *';

console.log('Starting cron job with schedule:', cronSchedule);

cron.schedule(cronSchedule, async () => {
    await checkAndCreateTkwMeasurements();
    console.log('Checked and created TKW measurements.');
});

export default app;
