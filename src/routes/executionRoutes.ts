import express from 'express';
import { verifyToken } from '../middleware';
import { Order, OrderStatus } from '../models/Order';
import { OrderExecution } from '../models/OrderExecution';
import { ProductExecution } from '../models/ProductExecution';
import { TkwMeasurement } from '../models/TkwMeasurement';
import { Operator } from '../models/Operator';
import { BlobServiceClient } from '@azure/storage-blob';
import multer from 'multer';
import { AppDataSource, logger } from '../index';
import { DeepPartial, IsNull } from 'typeorm';

const router = express.Router();
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    cb(null, true);
};

const upload = multer({ storage, fileFilter });

const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING!,
);
const containerClient = blobServiceClient.getContainerClient(
    process.env.AZURE_BLOB_CONTAINER_NAME!,
);

router.post(
    '/',
    verifyToken,
    upload.fields([{ name: 'packingPhoto' }, { name: 'consumptionPhoto' }]),
    async (req, res) => {
        try {
            const {
                orderId,
                applicationMethod,
                packedseedsToTreatKg,
                slurryConsumptionPerLotKg,
                currentPage,
                currentProductIndex,
            } = req.body;

            const files = req.files as { [fieldname: string]: Express.Multer.File[] };

            const user = req.user;
            const operator = await AppDataSource.getRepository(Operator).findOneBy({
                firebaseUserId: user.uid,
            });
            const order = await AppDataSource.getRepository(Order).findOneBy({ id: orderId });

            if (!operator) {
                res.status(404).json({ error: 'Operator not found' });
            } else if (!order) {
                res.status(400).json({ error: 'Invalid order ID' });
            } else {
                let orderExecution = await AppDataSource.getRepository(OrderExecution).findOne({
                    where: { order: { id: orderId } },
                    relations: ['productExecutions'],
                });

                if (orderExecution) {
                    // Update existing order execution
                    Object.assign(orderExecution, {
                        applicationMethod,
                        packedseedsToTreatKg,
                        slurryConsumptionPerLotKg,
                        currentPage,
                        currentProductIndex,
                    });

                    if (files['packingPhoto']) {
                        const packingPhotoFile = files['packingPhoto'][0];
                        const blobName = `packing_${orderId}_${Date.now()}.png`;
                        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
                        await blockBlobClient.uploadData(packingPhotoFile.buffer, {
                            blobHTTPHeaders: { blobContentType: packingPhotoFile.mimetype },
                        });
                        orderExecution.packingPhoto = blockBlobClient.url;
                    }

                    if (files['consumptionPhoto']) {
                        const consumptionPhotoFile = files['consumptionPhoto'][0];
                        const blobName = `consumption_${orderId}_${Date.now()}.png`;
                        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
                        await blockBlobClient.uploadData(consumptionPhotoFile.buffer, {
                            blobHTTPHeaders: { blobContentType: consumptionPhotoFile.mimetype },
                        });
                        orderExecution.consumptionPhoto = blockBlobClient.url;
                    }
                } else {
                    const newOrderExecution: DeepPartial<OrderExecution> = {
                        order,
                        operator,
                        applicationMethod,
                        packedseedsToTreatKg,
                        slurryConsumptionPerLotKg,
                        currentPage,
                        currentProductIndex,
                    };

                    if (files['packingPhoto']) {
                        const packingPhotoFile = files['packingPhoto'][0];
                        const blobName = `packing_${orderId}_${Date.now()}.png`;
                        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
                        await blockBlobClient.uploadData(packingPhotoFile.buffer, {
                            blobHTTPHeaders: { blobContentType: packingPhotoFile.mimetype },
                        });
                        newOrderExecution.packingPhoto = blockBlobClient.url;
                    }

                    if (files['consumptionPhoto']) {
                        const consumptionPhotoFile = files['consumptionPhoto'][0];
                        const blobName = `consumption_${orderId}_${Date.now()}.png`;
                        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
                        await blockBlobClient.uploadData(consumptionPhotoFile.buffer, {
                            blobHTTPHeaders: { blobContentType: consumptionPhotoFile.mimetype },
                        });
                        newOrderExecution.consumptionPhoto = blockBlobClient.url;
                    }

                    // Create new order execution
                    orderExecution =
                        AppDataSource.getRepository(OrderExecution).create(newOrderExecution);
                }

                const savedOrderExecution =
                    await AppDataSource.getRepository(OrderExecution).save(orderExecution);
                res.status(201).json(savedOrderExecution);
            }
        } catch (error) {
            logger.error('Failed to create or update order execution:', error);
            res.status(500).json({ error: 'Failed to create or update order execution' });
        }
    },
);

router.post(
    '/:orderExecutionId/product-execution',
    verifyToken,
    upload.fields([{ name: 'applicationPhoto' }, { name: 'consumptionPhoto' }]),
    async (req, res) => {
        try {
            const { orderExecutionId } = req.params;
            const productExecutionData = JSON.parse(req.body.productExecution)[0];

            const files = req.files as { [fieldname: string]: Express.Multer.File[] };

            const orderExecution = await AppDataSource.getRepository(OrderExecution).findOne({
                where: { id: orderExecutionId },
                relations: ['productExecutions'],
            });

            if (!orderExecution) {
                res.status(404).json({ error: 'Order execution not found' });
                return;
            }

            let productExecution = orderExecution.productExecutions.find(
                (pe) => pe.productId === productExecutionData.productId,
            );
            if (productExecution) {
                Object.assign(productExecution, productExecutionData);

                if (files['applicationPhoto']) {
                    const applicationPhotoFile = files['applicationPhoto'][0];
                    const blobName = `application_${orderExecutionId}_${productExecutionData.productId}_${Date.now()}.png`;
                    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
                    await blockBlobClient.uploadData(applicationPhotoFile.buffer, {
                        blobHTTPHeaders: { blobContentType: applicationPhotoFile.mimetype },
                    });
                    productExecution.applicationPhoto = blockBlobClient.url;
                }

                if (files['consumptionPhoto']) {
                    const consumptionPhotoFile = files['consumptionPhoto'][0];
                    const blobName = `consumption_${orderExecutionId}_${productExecutionData.productId}_${Date.now()}.png`;
                    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
                    await blockBlobClient.uploadData(consumptionPhotoFile.buffer, {
                        blobHTTPHeaders: { blobContentType: consumptionPhotoFile.mimetype },
                    });
                    productExecution.consumptionPhoto = blockBlobClient.url;
                }
            } else {
                productExecution = AppDataSource.getRepository(ProductExecution).create(
                    productExecutionData as ProductExecution,
                );
                orderExecution.productExecutions.push(productExecution);
            }

            const savedOrderExecution =
                await AppDataSource.getRepository(OrderExecution).save(orderExecution);
            res.status(201).json(savedOrderExecution);
        } catch (error) {
            logger.error('Failed to create or update product execution:', error);
            res.status(500).json({ error: 'Failed to create or update product execution' });
        }
    },
);

router.post('/:orderId/praparation-start', verifyToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const orderExecution = await AppDataSource.getRepository(OrderExecution).findOne({
            where: { order: { id: orderId } },
            relations: ['order'],
        });

        if (orderExecution) {
            orderExecution.preparationStartDate = Date.now();
            await AppDataSource.getRepository(OrderExecution).save(orderExecution);
            res.json(orderExecution);
        } else {
            res.status(404).json({ error: 'Order execution not found' });
        }
    } catch (error) {
        logger.error('Failed to start order execution:', error);
        res.status(500).json({ error: 'Failed to start order execution' });
    }
});

router.post('/:orderId/start', verifyToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const orderExecution = await AppDataSource.getRepository(OrderExecution).findOne({
            where: { order: { id: orderId } },
            relations: ['order'],
        });

        if (orderExecution) {
            orderExecution.treatmentStartDate = Date.now();
            await AppDataSource.getRepository(OrderExecution).save(orderExecution);
            res.json(orderExecution);
        } else {
            res.status(404).json({ error: 'Order execution not found' });
        }
    } catch (error) {
        logger.error('Failed to start order execution:', error);
        res.status(500).json({ error: 'Failed to start order execution' });
    }
});

router.post('/:orderId/finish', verifyToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const orderExecution = await AppDataSource.getRepository(OrderExecution).findOne({
            where: { order: { id: orderId } },
            relations: ['order'],
        });

        if (orderExecution) {
            orderExecution.treatmentFinishDate = Date.now();
            await AppDataSource.getRepository(OrderExecution).save(orderExecution);
            res.json(orderExecution);
        } else {
            res.status(404).json({ error: 'Order execution not found' });
        }
    } catch (error) {
        logger.error('Failed to finish order execution:', error);
        res.status(500).json({ error: 'Failed to finish order execution' });
    }
});

router.get('/:orderId/start-date', verifyToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const orderExecution = await AppDataSource.getRepository(OrderExecution)
            .createQueryBuilder('OrderExecution')
            .leftJoinAndSelect('OrderExecution.order', 'order')
            .where('order.id = :orderId', { orderId })
            .select(['OrderExecution.id', 'OrderExecution.treatmentStartDate'])
            .getOne();

        if (orderExecution) {
            res.json({ treatmentStartDate: orderExecution.treatmentStartDate });
        } else {
            res.status(404).json({ error: 'Order execution not found' });
        }
    } catch (error) {
        logger.error('Failed to fetch order execution start date:', error);
        res.status(500).json({ error: 'Failed to fetch order execution start date' });
    }
});

router.get('/:orderId/preparation-start-date', verifyToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const orderExecution = await AppDataSource.getRepository(OrderExecution)
            .createQueryBuilder('OrderExecution')
            .leftJoinAndSelect('OrderExecution.order', 'order')
            .where('order.id = :orderId', { orderId })
            .select(['OrderExecution.id', 'OrderExecution.preparationStartDate'])
            .getOne();

        if (orderExecution) {
            res.json({ preparationStartDate: orderExecution.preparationStartDate });
        } else {
            res.status(404).json({ error: 'Order execution not found' });
        }
    } catch (error) {
        logger.error('Failed to fetch order execution preparation start date:', error);
        res.status(500).json({ error: 'Failed to fetch order execution preparation start date' });
    }
});

router.get('/:orderId/finish-date', verifyToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const orderExecution = await AppDataSource.getRepository(OrderExecution)
            .createQueryBuilder('OrderExecution')
            .leftJoinAndSelect('OrderExecution.order', 'order')
            .where('order.id = :orderId', { orderId })
            .select(['OrderExecution.id', 'OrderExecution.treatmentFinishDate'])
            .getOne();

        if (orderExecution) {
            res.json({ treatmentFinishDate: orderExecution.treatmentFinishDate });
        } else {
            res.status(404).json({ error: 'Order execution not found' });
        }
    } catch (error) {
        logger.error('Failed to fetch order execution finish date:', error);
        res.status(500).json({ error: 'Failed to fetch order execution finish date' });
    }
});

router.get('/:orderId/latest-tkw', verifyToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const tkwMeasurement = await AppDataSource.getRepository(TkwMeasurement)
            .createQueryBuilder('tm')
            .leftJoin('tm.orderExecution', 'oe')
            .leftJoin('oe.order', 'ord')
            .where('ord.id = :orderId', { orderId })
            .select(['tm.id', 'tm.creationDate'])
            .orderBy('tm.creationDate', 'DESC')
            .getOne();

        if (tkwMeasurement) {
            res.json({ creationDate: tkwMeasurement.creationDate });
        } else {
            res.status(404).json({ error: 'TKW measurement not found' });
        }
    } catch (error) {
        logger.error('Failed to fetch latest TKW measurement date:', error);
        res.status(500).json({ error: 'Failed to fetch latest TKW measurement date' });
    }
});

router.get('/user-order-executions', verifyToken, async (req, res) => {
    try {
        const user = req.user;
        const operator = await AppDataSource.getRepository(Operator).findOneBy({
            firebaseUserId: user.uid,
        });

        if (!operator) {
            res.status(404).json({ error: 'Operator not found' });
        } else {
            const orderExecutions = await AppDataSource.getRepository(OrderExecution).find({
                where: { operator: { id: operator.id } },
                relations: ['productExecutions', 'order'],
            });

            res.json(
                orderExecutions.map((orderExecution) => ({
                    orderId: orderExecution.order.id,
                    ...orderExecution,
                })),
            );
        }
    } catch (error) {
        logger.error('Failed to fetch user order executions:', error);
        res.status(500).json({ error: 'Failed to fetch user order executions' });
    }
});

router.get('/tkw-measurements', verifyToken, async (req, res) => {
    const start = Date.now();
    try {
        logger.debug(`Starting TKW measurements fetch process at ${new Date().toISOString()}`);

        const queryStart = Date.now();
        const tkwMeasurements = await AppDataSource.getRepository(TkwMeasurement).find({
            where: { probeDate: undefined },
            relations: ['orderExecution', 'orderExecution.order'],
        });
        const queryEnd = Date.now();
        logger.debug(`TKW measurements DB query took ${queryEnd - queryStart} ms`);

        const mapStart = Date.now();
        const response = tkwMeasurements.map((measurement) => {
            const { order, ...orderExecutionData } = measurement.orderExecution;
            return {
                ...measurement,
                orderExecution: {
                    ...orderExecutionData,
                    orderId: order.id,
                },
            };
        });
        const mapEnd = Date.now();
        logger.debug(`Mapping TKW measurements took ${mapEnd - mapStart} ms`);

        const totalTime = Date.now() - start;
        logger.debug(`TKW measurements request completed in ${totalTime} ms`);

        res.status(200).json(response);
    } catch (error) {
        logger.error('Failed to fetch TKW measurements:', error);
        res.status(500).json({ error: 'Failed to fetch TKW measurements' });
    }
});

router.put(
    '/tkw-measurements/:id',
    verifyToken,
    upload.single('tkwProbesPhoto'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { tkwRep1, tkwRep2, tkwRep3 } = req.body;
            const tkwMeasurement = await AppDataSource.getRepository(TkwMeasurement).findOne({
                where: { id },
                relations: ['orderExecution', 'orderExecution.order'],
            });
            if (!tkwMeasurement) {
                res.status(404).json({ error: 'TKW measurement not found' });
            } else {
                tkwMeasurement.tkwProbe1 = tkwRep1;
                tkwMeasurement.tkwProbe2 = tkwRep2;
                tkwMeasurement.tkwProbe3 = tkwRep3;
                tkwMeasurement.probeDate = new Date();

                if (req.file) {
                    const blobName = `tkw_${id}_${Date.now()}.png`;
                    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
                    await blockBlobClient.uploadData(req.file.buffer, {
                        blobHTTPHeaders: { blobContentType: req.file.mimetype },
                    });
                    tkwMeasurement.tkwProbesPhoto = blockBlobClient.url;
                }

                const updatedTkwMeasurement =
                    await AppDataSource.getRepository(TkwMeasurement).save(tkwMeasurement);

                const orderRepository = AppDataSource.getRepository(Order);
                const order = await orderRepository.findOne({
                    where: { id: tkwMeasurement.orderExecution.order.id },
                });
                if (order) {
                    if (order.status === OrderStatus.LabControl) {
                        const incompleteMeasurements = await AppDataSource.getRepository(
                            TkwMeasurement,
                        ).find({
                            where: {
                                orderExecution: { order: { id: order.id } },
                                probeDate: IsNull(),
                            },
                        });

                        if (incompleteMeasurements.length === 0) {
                            order.status = OrderStatus.ToAcknowledge;
                            await orderRepository.save(order);
                            logger.info(
                                `Order status updated to ToAcknowledge for order ID: ${order.id}`,
                            );
                        } else {
                            console.log('Incomplete measurements:', incompleteMeasurements);
                        }
                    }
                } else {
                    res.status(404).json({ error: 'Order not found' });
                }

                res.json(updatedTkwMeasurement);
            }
        } catch (error) {
            logger.error('Failed to update TKW measurement:', error);
            res.status(500).json({ error: 'Failed to update TKW measurement' });
        }
    },
);

router.get('/:orderId', verifyToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const orderExecution = await AppDataSource.getRepository(OrderExecution).findOne({
            where: { order: { id: orderId } },
            relations: ['productExecutions'],
            select: [
                'id',
                'operator',
                'applicationMethod',
                'packedseedsToTreatKg',
                'slurryConsumptionPerLotKg',
                'currentPage',
                'currentProductIndex',
                'treatmentStartDate',
                'treatmentFinishDate',
                'consumptionPhoto',
                'packingPhoto',
            ],
        });

        if (orderExecution) {
            res.json({
                ...orderExecution,
                orderId,
            });
        } else {
            res.status(404).json({ error: 'Order execution not found' });
        }
    } catch (error) {
        logger.error('Failed to fetch order execution:', error);
        res.status(500).json({ error: 'Failed to fetch order execution' });
    }
});

router.get('/:executionId/tkw-measurements', verifyToken, async (req, res) => {
    try {
        const { executionId } = req.params;
        const tkwMeasurements = await AppDataSource.getRepository(TkwMeasurement).find({
            where: { orderExecution: { id: executionId } },
        });

        if (tkwMeasurements.length > 0) {
            res.json(tkwMeasurements);
        } else {
            res.status(404).json({ error: 'TKW measurements not found' });
        }
    } catch (error) {
        logger.error('Failed to fetch TKW measurements:', error);
        res.status(500).json({ error: 'Failed to fetch TKW measurements' });
    }
});

export default router;
