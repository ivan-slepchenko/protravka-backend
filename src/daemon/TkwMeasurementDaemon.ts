import { OrderExecution } from '../models/OrderExecution';
import { TkwMeasurement } from '../models/TkwMeasurement';
import { OrderStatus } from '../models/Order';
import { AppDataSource } from '..';

export async function checkAndCreateTkwMeasurements() {
    const orderExecutionRepository = AppDataSource.getRepository(OrderExecution);
    const tkwMeasurementRepository = AppDataSource.getRepository(TkwMeasurement);

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
            : orderExecution.treatmentStart;
        const timeDiff = lastProbeTime ? now.getTime() - new Date(lastProbeTime).getTime() : null; // It may happen that treatment is not started yet for Order in progress.
        const interval = orderExecution.order.tkwMeasurementInterval * 60000; // Convert minutes to milliseconds

        if (timeDiff !== null && timeDiff >= interval) {
            // 1 hour in milliseconds
            const newMeasurement = new TkwMeasurement();
            newMeasurement.creationDate = now;
            newMeasurement.orderExecution = orderExecution;
            await tkwMeasurementRepository.save(newMeasurement);
        }
    }
}
