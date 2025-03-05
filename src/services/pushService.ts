import admin from 'firebase-admin';
import { AppDataSource } from '../index';
import { Operator, Role } from '../models/Operator';
import { Company } from '../models/Company';
import { Not } from 'typeorm';
import { logger } from '../index';
import { Order } from '../models/Order';
import { TkwMeasurement } from '../models/TkwMeasurement';

export const notifyNewOrderCreated = async (
    operator: Operator | null,
    company: Company,
    order: Order,
) => {
    logger.debug('Notify New Order Created:', operator, company);
    await sendPushNotification(
        operator,
        company,
        'New Order Created',
        `Lot Number: ${order.lotNumber}\nVariety: ${order.variety.name}`,
        `/lab/${order.id}`,
    );
};

export const notifyNewTkwMeasurementCreated = async (company: Company, order: Order) => {
    logger.debug('Notify New Processed Tkw Measurement Created:', company.name);
    await notifyLabOperators(
        company,
        'New Processed TKW Measurement Created',
        `Lot Number: ${order.lotNumber}\nVariety: ${order.variety.name}`,
        `/lab/${order.id}`,
    );
};

export const notifyNewRawTkwMEasurementCreated = async (company: Company, order: Order) => {
    logger.debug('Notify New Raw Tkw Measurement Created:', company.name);
    await notifyLabOperators(
        company,
        'New Raw TKW Measurement Created', //'new_raw_tkw_measurement.title',
        `Lot Number: ${order.lotNumber}\nVariety: ${order.variety.name}`, //'new_raw_tkw_measurement.message',
        '/execution',
    );
};

const sendPushNotification = async (
    operator: Operator | null,
    company: Company,
    title: string,
    body: string,
    clickAction: string,
) => {
    if (operator) {
        if (!operator.firebaseToken || !operator.roles.includes(Role.OPERATOR)) {
            logger.error(
                'Operator does not have a Firebase token or is not an OPERATOR:',
                operator,
            );
        } else {
            const message = {
                notification: {
                    title,
                    body,
                },
                data: {
                    click_action: clickAction,
                },
                token: operator.firebaseToken,
            };

            try {
                const response = await admin.messaging().send(message);
                logger.info(`Successfully sent message: ${response}`);
            } catch (error) {
                logger.error('Error sending message:', error);
            }
        }
    } else {
        const companyOperators = await AppDataSource.getRepository(Operator).find({
            where: { company, firebaseToken: Not('') },
        });
        await Promise.all(
            companyOperators.map(async (op) => {
                if (!op.firebaseToken || !op.roles.includes(Role.OPERATOR)) return;
                const message = {
                    notification: {
                        title,
                        body,
                    },
                    data: {
                        click_action: clickAction,
                    },
                    token: op.firebaseToken,
                };
                try {
                    const response = await admin.messaging().send(message);
                    logger.info(`Message sent to operator ${op.id}: ${response}`);
                } catch (error) {
                    logger.error(`Error sending message to operator ${op.id}:`, error);
                }
            }),
        );
    }
};

const notifyLabOperators = async (
    company: Company,
    title: string,
    body: string,
    clickAction: string,
) => {
    logger.debug('Notify Lab Operators:', company, title, body);
    const labOperators = await AppDataSource.getRepository(Operator)
        .createQueryBuilder('operator')
        .where('operator.companyId = :companyId', { companyId: company.id })
        .andWhere('operator.firebaseToken IS NOT NULL')
        .getMany();
    await Promise.all(
        labOperators.map(async (op) => {
            if (!op.firebaseToken || !op.roles.includes(Role.LABORATORY)) return;
            const message = {
                notification: {
                    title,
                    body,
                },
                data: {
                    click_action: clickAction,
                },
                token: op.firebaseToken,
            };
            try {
                const response = await admin.messaging().send(message);
                logger.info(
                    `Message sent to lab operator ${op.email}: firebaseToken: ${op.firebaseToken}, response: ${response}`,
                );
            } catch (error) {
                logger.error(`Error sending message to lab operator ${op.id}:`, error);
            }
        }),
    );
};
