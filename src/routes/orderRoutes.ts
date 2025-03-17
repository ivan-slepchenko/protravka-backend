import express from 'express';
import { verifyToken } from '../middleware';
import { Order, OrderStatus } from '../models/Order';
import { ProductRecipe } from '../models/ProductRecipe';
import { createOrderRecipe as createOrderRecipeData } from '../calculator/calculator';
import { AppDataSource, FeatureFlags, logger } from '../index';
import { BlobServiceClient } from '@azure/storage-blob';
import multer from 'multer';
import { Operator } from '../models/Operator';
import { Crop } from '../models/Crop';
import { Variety } from '../models/Variety';
import { Product } from '../models/Product';
import { OrderRecipe } from '../models/OrderRecipe';
import { OrderExecution } from '../models/OrderExecution';
import { checkAndCreateTkwMeasurementsForOrderExecution } from '../daemon/TkwMeasurementDaemon';
import { notifyNewOrderCreated, notifyNewRawTkwMEasurementCreated } from '../services/pushService';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING!,
);
const containerClient = blobServiceClient.getContainerClient(
    process.env.AZURE_BLOB_CONTAINER_NAME!,
);

router.post('/calculate-order', verifyToken, async (req, res) => {
    try {
        const order = req.body;

        // Fetch product details and add them to the order
        const productDetailsWithProduct = await Promise.all(
            order.productDetails.map(async (detail: any) => {
                const product = await AppDataSource.getRepository(Product).findOneBy({
                    id: detail.productId,
                });
                if (!product) {
                    throw new Error(`Invalid product ID: ${detail.productId}`);
                }
                return { ...detail, product };
            }),
        );

        order.productDetails = productDetailsWithProduct;

        const calculatedValues = createOrderRecipeData(order);
        if (calculatedValues === undefined) {
            logger.error('Invalid order recipe data:', calculatedValues);
            res.status(400).json({
                error: 'Invalid order recipe data',
                message: 'Invalid order recipe data',
            });
        } else {
            res.json({
                slurryTotalMlRecipeToMix: calculatedValues.slurryTotalMlRecipeToMix,
                slurryTotalGrRecipeToMix: calculatedValues.slurryTotalGrRecipeToMix,
                totalCompoundsDensity: calculatedValues.totalCompoundsDensity,
            });
        }
    } catch (error) {
        logger.error('Failed to calculate order:', error);
        res.status(500).json({ error: 'Failed to calculate order' });
    }
});

router.get('/', verifyToken, async (req, res) => {
    try {
        const user = req.user;
        const operator = await AppDataSource.getRepository(Operator).findOne({
            where: { firebaseUserId: user.uid },
            relations: [
                'company',
                'company.orders',
                'company.orders.productDetails',
                'company.orders.productDetails.product',
                'company.orders.operator',
                'company.orders.orderRecipe',
                'company.orders.orderRecipe.productRecipes',
                'company.orders.orderRecipe.productRecipes.productDetail',
                'company.orders.orderRecipe.productRecipes.productDetail.product',
            ],
        });

        if (!operator || !operator.company) {
            res.status(404).json({ error: 'Operator or company not found' });
            return;
        }

        const orders = operator.company.orders.filter(
            (order) => order.status !== OrderStatus.Archived,
        );
        res.json(orders);
    } catch (error) {
        logger.error('Failed to fetch orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

router.post('/', verifyToken, async (req, res) => {
    try {
        const {
            productDetails,
            operatorId,
            cropId,
            varietyId,
            tkwMeasurementInterval,
            ...orderData
        } = req.body;

        const user = req.user;
        const operatorManager = await AppDataSource.getRepository(Operator).findOne({
            where: { firebaseUserId: user.uid },
            relations: ['company'],
        });

        if (!operatorManager || !operatorManager.company) {
            res.status(400).json({
                error: 'Operator not found or not associated with a company',
                message: 'Operator not found or not associated with a company',
            });
            return;
        }

        const isLabUsed = (JSON.parse(operatorManager.company.featureFlags) as FeatureFlags).useLab;

        console.log('Operator Id:', operatorId);

        const operator =
            operatorId === undefined || operatorId === null
                ? null
                : await AppDataSource.getRepository(Operator).findOneBy({ id: operatorId });
        console.log('Operator:', operator);
        const crop = await AppDataSource.getRepository(Crop).findOneBy({ id: cropId });
        const variety = await AppDataSource.getRepository(Variety).findOneBy({ id: varietyId });

        //TODO: IVAN - im not sure when it operatorId be undefined
        if ((!operator && operatorId !== undefined && operatorId !== null) || !crop || !variety) {
            res.status(400).json({
                error: 'Invalid operator, crop, or variety ID',
                message: 'Invalid operator, crop, or variety ID',
            });
        } else {
            const productDetailsWithProduct = await Promise.all(
                productDetails.map(async (detail: any) => {
                    const product = await AppDataSource.getRepository(Product).findOneBy({
                        id: detail.productId,
                    });
                    if (!product) {
                        throw new Error(`Invalid product ID: ${detail.productId}`);
                    }
                    return { ...detail, product };
                }),
            );

            const order = AppDataSource.getRepository(Order).create({
                ...(orderData as Partial<Order>),
                operator,
                crop,
                variety,
                productDetails: productDetailsWithProduct,
                tkwMeasurementInterval: tkwMeasurementInterval || 60,
                creationDate: Date.now(),
                company: operatorManager.company,
            });
            const savedOrder = await AppDataSource.getRepository(Order).save(order);

            console.log('Order created:', order);

            if (!isLabUsed) {
                const orderRecipeData = createOrderRecipeData(savedOrder);
                if (orderRecipeData === undefined) {
                    logger.error('Invalid order recipe data:', orderRecipeData);
                    res.status(400).json({
                        error: 'Invalid order recipe data',
                        message: 'Invalid order recipe data',
                    });
                } else {
                    const productRecipes = orderRecipeData.productRecipes.map((recipeData) =>
                        AppDataSource.getRepository(ProductRecipe).create(recipeData),
                    );
                    await AppDataSource.getRepository(ProductRecipe).save(productRecipes);

                    const orderRecipe = AppDataSource.getRepository(OrderRecipe).create({
                        ...orderRecipeData,
                        productRecipes,
                    });
                    savedOrder.orderRecipe = orderRecipe;

                    logger.debug('Order Data:', savedOrder);

                    const updatedOrder = await AppDataSource.getRepository(Order).save(savedOrder);

                    logger.debug('Updated Order:', updatedOrder);

                    await notifyNewOrderCreated(operator, operatorManager.company, updatedOrder);

                    res.status(201).json(updatedOrder);
                }
            } else {
                await notifyNewRawTkwMEasurementCreated(operatorManager.company, savedOrder);
                res.status(201).json(savedOrder);
            }
        }
    } catch (error) {
        logger.error('Failed to create order:', error);
        res.status(500).json({ error: 'Failed to create order', message: error });
    }
});

router.put('/:id/status', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const user = req.user;

        const order = await AppDataSource.getRepository(Order).findOne({
            where: { id },
            relations: ['operator'],
        });
        if (order) {
            order.status = status;

            if (status === OrderStatus.Completed || status === OrderStatus.Failed) {
                order.completionDate = Date.now();
            }

            if (order.operator === null && status === OrderStatus.TreatmentInProgress) {
                const operator = await AppDataSource.getRepository(Operator).findOne({
                    where: { firebaseUserId: user.uid },
                });
                if (operator) {
                    order.operator = operator;
                }
            }
            await AppDataSource.getRepository(Order).save(order);

            if (status === OrderStatus.LabToControl) {
                const orderExecution = await AppDataSource.getRepository(OrderExecution).findOne({
                    where: { order: { id } },
                    relations: ['order', 'order.company'],
                });
                if (orderExecution) {
                    checkAndCreateTkwMeasurementsForOrderExecution(orderExecution);
                }
            }
            res.json(order);
        } else {
            res.status(404).json({ error: 'Order not found' });
        }
    } catch (error) {
        logger.error('Failed to update order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

router.put('/:id/tkw', verifyToken, upload.single('tkwProbesPhoto'), async (req, res) => {
    try {
        const { id } = req.params;
        const { tkwData } = req.body;
        const { tkwRep1, tkwRep2, tkwRep3 } = JSON.parse(tkwData);
        const order = await AppDataSource.getRepository(Order).findOneBy({ id });
        if (order) {
            order.tkwRep1 = tkwRep1;
            order.tkwRep2 = tkwRep2;
            order.tkwRep3 = tkwRep3;
            order.tkw = (tkwRep1 + tkwRep2 + tkwRep3) / 3;
            order.status = OrderStatus.TKWConfirmed;
            order.tkwMeasurementDate = Date.now();

            if (req.file) {
                const blobName = `tkw_${id}_${Date.now()}.png`;
                const blockBlobClient = containerClient.getBlockBlobClient(blobName);

                await blockBlobClient.uploadData(req.file.buffer, {
                    blobHTTPHeaders: { blobContentType: req.file.mimetype },
                });

                order.tkwProbesPhoto = blockBlobClient.url;
            }

            await AppDataSource.getRepository(Order).save(order);
            res.json(order);
        } else {
            res.status(404).json({ error: 'Order not found' });
        }
    } catch (error) {
        logger.error('Failed to update order TKW values:', error);
        res.status(500).json({ error: 'Failed to update order TKW values' });
    }
});

router.put('/:id/finalize', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { productDetails, operatorId, cropId, varietyId, ...orderData } = req.body;

        const operator =
            operatorId === null
                ? null
                : await AppDataSource.getRepository(Operator).findOneBy({ id: operatorId });
        const crop = await AppDataSource.getRepository(Crop).findOneBy({ id: cropId });
        const variety = await AppDataSource.getRepository(Variety).findOneBy({ id: varietyId });

        if ((!operator && operatorId !== null) || !crop || !variety) {
            res.status(400).json({
                error: 'Invalid operator, crop, or variety ID',
                message: 'Invalid operator, crop, or variety ID',
            });
        } else {
            const productDetailsWithProduct = await Promise.all(
                productDetails.map(async (detail: any) => {
                    const product = await AppDataSource.getRepository(Product).findOne({
                        where: { id: detail.productId },
                        relations: ['company'],
                    });
                    if (!product) {
                        throw new Error(`Invalid product ID: ${detail.productId}`);
                    }
                    return { ...detail, product };
                }),
            );

            const order = await AppDataSource.getRepository(Order).findOneBy({ id });
            if (!order) {
                res.status(404).json({ error: 'Order not found' });
                return;
            }

            AppDataSource.getRepository(Order).merge(order, {
                ...(orderData as Partial<Order>),
                operator,
                crop,
                variety,
                productDetails: productDetailsWithProduct,
                finalizationDate: Date.now(),
                status: OrderStatus.RecipeCreated,
            });

            const savedOrder = await AppDataSource.getRepository(Order).save(order);

            const orderRecipeData = createOrderRecipeData(savedOrder);
            if (orderRecipeData === undefined) {
                logger.error('Invalid order recipe data:', orderRecipeData);
                res.status(400).json({
                    error: 'Invalid order recipe data',
                    message: 'Invalid order recipe data',
                });
            } else {
                const productRecipes = orderRecipeData.productRecipes.map((recipeData) =>
                    AppDataSource.getRepository(ProductRecipe).create(recipeData),
                );
                await AppDataSource.getRepository(ProductRecipe).save(productRecipes);

                const orderRecipe = AppDataSource.getRepository(OrderRecipe).create({
                    ...orderRecipeData,
                    productRecipes,
                });

                const savedRecipe =
                    await AppDataSource.getRepository(OrderRecipe).save(orderRecipe);

                savedOrder.orderRecipe = savedRecipe;

                logger.debug('Order Data:', savedOrder);

                const updatedOrder = await AppDataSource.getRepository(Order).save(savedOrder);

                logger.debug('Updated Order:', updatedOrder);

                await notifyNewOrderCreated(operator, order.company, updatedOrder);

                res.status(201).json(updatedOrder);
            }
        }
    } catch (error) {
        logger.error('Failed to update order:', error);
        res.status(500).json({ error: 'Failed to update order', message: error });
    }
});

router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const order = await AppDataSource.getRepository(Order).findOneBy({ id });
        if (order) {
            await AppDataSource.getRepository(Order).remove(order);
            res.json({ message: 'Order deleted successfully' });
        } else {
            res.status(404).json({ error: 'Order not found' });
        }
    } catch (error) {
        logger.error('Failed to delete order:', error);
        res.status(500).json({ error: 'Failed to delete order' });
    }
});

router.get('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const order = await AppDataSource.getRepository(Order).findOne({
            where: { id },
            relations: [
                'productDetails',
                'productDetails.product',
                'operator',
                'crop',
                'variety',
                'orderRecipe',
                'orderRecipe.productRecipes',
                'orderRecipe.productRecipes.productDetail',
                'orderRecipe.productRecipes.productDetail.product',
            ],
        });
        if (order) {
            res.json(order);
        } else {
            res.status(404).json({ error: 'Order not found' });
        }
    } catch (error) {
        logger.error('Failed to fetch order:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

export default router;
