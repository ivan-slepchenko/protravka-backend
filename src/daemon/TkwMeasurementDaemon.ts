import { getRepository } from 'typeorm';
import { OrderExecution } from '../models/OrderExecution';
import { TkwMeasurement } from '../models/TkwMeasurement';
import { OrderStatus } from '../models/Order';

async function checkAndCreateTkwMeasurements() {
    //TODO: fix deprecation
    const orderExecutionRepository = getRepository(OrderExecution);
    const tkwMeasurementRepository = getRepository(TkwMeasurement);

    const orderExecutions = await orderExecutionRepository.find({
        where: { order: { status: OrderStatus.InProgress } },
        relations: ['order'],
    });

    const now = new Date();

    for (const orderExecution of orderExecutions) {
        const lastMeasurement = await tkwMeasurementRepository.findOne({
            where: { orderExecution },
            order: { creationDate: 'DESC' },
        });

        const lastProbeTime = lastMeasurement
            ? lastMeasurement.creationDate
            : orderExecution.order.treatmentStart; //TODO: move treatment start from order to order execution
        const timeDiff = lastProbeTime ? now.getTime() - new Date(lastProbeTime).getTime() : null; // It may happen that treatment is not started yet for Order in progress.

        if (timeDiff !== null && timeDiff >= 3600000) {
            // 1 hour in milliseconds
            const newMeasurement = new TkwMeasurement();
            newMeasurement.creationDate = now;
            newMeasurement.orderExecution = orderExecution;
            await tkwMeasurementRepository.save(newMeasurement);
        }
    }
}

setInterval(checkAndCreateTkwMeasurements, 600000); // Run every 10 minutes
