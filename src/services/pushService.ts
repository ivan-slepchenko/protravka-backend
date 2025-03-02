import admin from 'firebase-admin';
import { AppDataSource } from '../index';
import { Operator, Role } from '../models/Operator';
import { Company } from '../models/Company';
import { Not } from 'typeorm';
import { logger } from '../index';

export const notifyNewOrderCreated = async (operator: Operator | null, company: Company) => {
    logger.debug('Notify New Order Created:', operator, company);
    await sendPushNotification(
        operator,
        company,
        'New Order Created',
        'New order is ready for execution, check your board!',
    );
};

export const sendPushNotification = async (
    operator: Operator | null,
    company: Company,
    title: string,
    body: string,
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

export const notifyLabOperators = async (company: Company, title: string, body: string) => {
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
                token: op.firebaseToken,
            };
            try {
                const response = await admin.messaging().send(message);
                logger.info(
                    `Message sent to lab operator ${op.id}: firebaseToken: ${op.firebaseToken}, response: ${response}`,
                );
            } catch (error) {
                logger.error(`Error sending message to lab operator ${op.id}:`, error);
            }
        }),
    );
};
