import { OrderExecution } from '../models/OrderExecution';
import { TkwMeasurement } from '../models/TkwMeasurement';
import { OrderStatus } from '../models/Order';
import { In, IsNull, Not } from 'typeorm';
import { AppDataSource, logger } from '../index';
import { notifyNewTkwMeasurementCreated } from '../services/pushService';

export async function checkAndCreateTkwMeasurements() {
    logger.info('Starting TKW measurement check and creation process.');

    const orderExecutionRepository = AppDataSource.getRepository(OrderExecution);

    try {
        const orderExecutions = await orderExecutionRepository.find({
            where: {
                treatmentStartDate: Not(IsNull()),
                order: {
                    status: In([OrderStatus.TreatmentInProgress]),
                },
            },
            relations: ['order', 'order.company'],
        });

        logger.info(`Found ${orderExecutions.length} order executions to check.`);

        for (const orderExecution of orderExecutions) {
            await checkAndCreateTkwMeasurementsForOrderExecution(orderExecution);
        }

        logger.info('TKW measurement check and creation process completed.');
    } catch (error) {
        logger.error('Error during TKW measurement check and creation process:', error);
    }
}

export async function checkAndCreateTkwMeasurementsForOrderExecution(
    orderExecution: OrderExecution,
) {
    const tkwMeasurementRepository = AppDataSource.getRepository(TkwMeasurement);
    const now = new Date();
    logger.info(`Checking order execution with ID: ${orderExecution.id}`);

    if (!orderExecution.order) {
        logger.error(`Order not found for order execution ID: ${orderExecution.id}`);
        return;
    }

    const lastMeasurement = await tkwMeasurementRepository.findOne({
        where: { orderExecution: { id: orderExecution.id } },
        order: { creationDate: 'DESC' },
        relations: ['orderExecution'],
    });

    const lastProbeTime = lastMeasurement
        ? lastMeasurement.creationDate
        : orderExecution.treatmentStartDate;
    const timeDiff = lastProbeTime ? now.getTime() - new Date(lastProbeTime).getTime() : null; // It may happen that treatment is not started yet for Order in progress.
    const interval = orderExecution.order.tkwMeasurementInterval * 60000; // Convert minutes to milliseconds

    logger.info(
        `Last probe time: ${lastProbeTime}, Time difference: ${timeDiff}, Interval: ${interval}, lastMeasurement ID: ${
            lastMeasurement ? lastMeasurement.id : 'none'
        }`,
    );

    if ((timeDiff !== null && timeDiff >= interval) || !lastMeasurement) {
        logger.info(`Creating new TKW measurement for order execution ID: ${orderExecution.id}`);
        const newMeasurement = new TkwMeasurement();
        newMeasurement.creationDate = now.getTime();
        newMeasurement.orderExecution = orderExecution;
        await tkwMeasurementRepository.save(newMeasurement);
        logger.info(`New TKW measurement created with ID: ${newMeasurement.id}`);

        if (!orderExecution.order.company) {
            logger.error(`Order not found for order execution ID: ${orderExecution.id}`);
        } else {
            await notifyNewTkwMeasurementCreated(
                orderExecution.order.company,
                orderExecution.order,
            );
        }
    }
}
