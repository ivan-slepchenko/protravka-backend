import { OrderExecution } from '../models/OrderExecution';
import { TkwMeasurement } from '../models/TkwMeasurement';
import { OrderStatus } from '../models/Order';
import { AppDataSource } from '..';
import { In } from 'typeorm';
import { logger } from '../index';

export async function checkAndCreateTkwMeasurements() {
    logger.info('Starting TKW measurement check and creation process.');

    const orderExecutionRepository = AppDataSource.getRepository(OrderExecution);
    const tkwMeasurementRepository = AppDataSource.getRepository(TkwMeasurement);

    try {
        const orderExecutions = await orderExecutionRepository.find({
            where: {
                order: {
                    status: In([OrderStatus.InProgress, OrderStatus.ForLabToControl]),
                },
            },
            relations: ['order'],
        });

        logger.info(`Found ${orderExecutions.length} order executions to check.`);

        const now = new Date();

        for (const orderExecution of orderExecutions) {
            logger.info(`Checking order execution with ID: ${orderExecution.id}`);

            const lastMeasurement = await tkwMeasurementRepository.findOne({
                where: { orderExecution },
                order: { creationDate: 'DESC' },
            });

            const lastProbeTime = lastMeasurement
                ? lastMeasurement.creationDate
                : orderExecution.treatmentStart;
            const timeDiff = lastProbeTime
                ? now.getTime() - new Date(lastProbeTime).getTime()
                : null; // It may happen that treatment is not started yet for Order in progress.
            const interval = orderExecution.order.tkwMeasurementInterval * 60000; // Convert minutes to milliseconds

            logger.info(
                `Last probe time: ${lastProbeTime}, Time difference: ${timeDiff}, Interval: ${interval}`,
            );

            if (timeDiff !== null && timeDiff >= interval) {
                logger.info(
                    `Creating new TKW measurement for order execution ID: ${orderExecution.id}`,
                );
                const newMeasurement = new TkwMeasurement();
                newMeasurement.creationDate = now;
                newMeasurement.orderExecution = orderExecution;
                await tkwMeasurementRepository.save(newMeasurement);
                logger.info(`New TKW measurement created with ID: ${newMeasurement.id}`);
            } else {
                logger.info(
                    `No new TKW measurement needed for order execution ID: ${orderExecution.id}`,
                );
            }
        }

        logger.info('TKW measurement check and creation process completed.');
    } catch (error) {
        logger.error('Error during TKW measurement check and creation process:', error);
    }
}
