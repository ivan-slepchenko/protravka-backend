import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { Order, OrderStatus } from './models/Order';
import 'reflect-metadata';
import { Not } from 'typeorm';
import log4js from 'log4js';
import fs from 'fs';
import path from 'path';
import { version } from '../package.json';
import { Operator } from './models/Operator';
import { Crop } from './models/Crop';
import { Variety } from './models/Variety';
import { Product } from './models/Product';
import cookieParser from 'cookie-parser';
import { registerUser, loginUser, logoutUser, resetPassword } from './controllers/firebaseAuth';
import { verifyToken } from './middleware';
import { DataSource } from 'typeorm';
import { ProductDetail } from './models/ProductDetail';
import { OrderExecution } from './models/OrderExecution';
import { ProductExecution } from './models/ProductExecution';
import { OrderRecipe } from './models/OrderRecipe';
import { ProductRecipe } from './models/ProductRecipe';
import { createOrderRecipe } from './calculator/calculator';

console.log('Version:', version);

dotenv.config({ path: '.env' });

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
        OrderExecution,
        ProductExecution,
        OrderRecipe,
        ProductRecipe,
    ], // Ensure Operator entity is included
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

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
    origin: [/^http:\/\/localhost(:\d+)?$/, /\.azurecontainerapps\.io$/], // Allow localhost and any subdomain and port from azurecontainerapps.io
    credentials: true, // Allow credentials
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' })); // Increase payload size limit for JSON
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Increase payload size limit for URL-encoded data
app.use(cookieParser());

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

app.get('/', (req, res) => {
    res.send(`Hello World! Version: ${version}`);
});
app.get('/api/orders', verifyToken, async (req, res) => {
    try {
        const orders = await AppDataSource.getRepository(Order).find({
            where: { status: Not(OrderStatus.Archived) },
            relations: [
                'productDetails',
                'productDetails.product',
                'operator',
                'orderRecipe',
                'orderRecipe.productRecipes',
                'orderRecipe.productRecipes.productDetail',
                'orderRecipe.productRecipes.productDetail.product',
            ], // Remove 'orderExecution' and 'orderExecution.productExecutions'
        });
        res.json(orders);
    } catch (error) {
        logger.error('Failed to fetch orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

app.get('/api/orders/Archived', verifyToken, async (req, res) => {
    try {
        const ArchivedOrders = await AppDataSource.getRepository(Order).find({
            where: { status: OrderStatus.Archived },
            relations: ['productDetails', 'productDetails.product', 'operator'], // Include ProductDetails and Product relationships
        });
        res.json(ArchivedOrders);
    } catch (error) {
        logger.error('Failed to fetch Archived orders:', error);
        res.status(500).json({ error: 'Failed to fetch Archived orders' });
    }
});

app.get('/features', (req, res) => {
    res.json({ lab: process.env.LAB_FEATURE === 'true' });
});

app.post('/api/orders', verifyToken, async (req, res) => {
    try {
        const { productDetails, operatorId, cropId, varietyId, ...orderData } = req.body;

        const operator =
            operatorId === undefined
                ? null
                : await AppDataSource.getRepository(Operator).findOneBy({ id: operatorId });
        const crop = await AppDataSource.getRepository(Crop).findOneBy({ id: cropId });
        const variety = await AppDataSource.getRepository(Variety).findOneBy({ id: varietyId });

        if ((!operator && operatorId !== undefined) || !crop || !variety) {
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
            });
            const savedOrder = await AppDataSource.getRepository(Order).save(order);

            console.log('Order created:', order);

            if (process.env.LAB_FEATURE !== 'true') {
                const orderRecipeData = createOrderRecipe(savedOrder);
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

                    res.status(201).json(updatedOrder);
                }
            } else {
                res.status(201).json(savedOrder);
            }
        }
    } catch (error) {
        logger.error('Failed to create order:', error);
        res.status(500).json({ error: 'Failed to create order', message: error });
    }
});

app.put('/api/orders/:id/status', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const order = await AppDataSource.getRepository(Order).findOneBy({ id });
        if (order) {
            order.status = status;
            await AppDataSource.getRepository(Order).save(order);
            res.json(order);
        } else {
            res.status(404).json({ error: 'Order not found' });
        }
    } catch (error) {
        logger.error('Failed to update order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

app.put('/api/orders/:id/tkw', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { tkwRep1, tkwRep2, tkwRep3, tkw, tkwProbesPhoto } = req.body;
        const order = await AppDataSource.getRepository(Order).findOneBy({ id });
        if (order) {
            order.tkwRep1 = tkwRep1;
            order.tkwRep2 = tkwRep2;
            order.tkwRep3 = tkwRep3;
            order.tkw = tkw;
            order.tkwProbesPhoto = tkwProbesPhoto; // Update tkwProbesPhoto
            order.status = OrderStatus.ByLabInitiated; // Update status to ReadyToStart
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

app.put('/api/orders/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { productDetails, operatorId, cropId, varietyId, ...orderData } = req.body;

        const operator =
            operatorId === undefined
                ? null
                : await AppDataSource.getRepository(Operator).findOneBy({ id: operatorId });
        const crop = await AppDataSource.getRepository(Crop).findOneBy({ id: cropId });
        const variety = await AppDataSource.getRepository(Variety).findOneBy({ id: varietyId });

        if ((!operator && operatorId !== undefined) || !crop || !variety) {
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
            });

            const updatedOrder = await AppDataSource.getRepository(Order).save(order);
            res.json(updatedOrder);
        }
    } catch (error) {
        logger.error('Failed to update order:', error);
        res.status(500).json({ error: 'Failed to update order', message: error });
    }
});

app.delete('/api/orders/:id', verifyToken, async (req, res) => {
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

app.get('/api/orders/:id', verifyToken, async (req, res) => {
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

app.get('/api/operators', verifyToken, async (req, res) => {
    try {
        const operators = await AppDataSource.getRepository(Operator).find();
        res.json(operators);
    } catch (error) {
        logger.error('Failed to fetch operators:', error);
        res.status(500).json({ error: 'Failed to fetch operators' });
    }
});

app.post('/api/operators', verifyToken, async (req, res) => {
    try {
        const operator = AppDataSource.getRepository(Operator).create(req.body);
        const savedOperator = await AppDataSource.getRepository(Operator).save(operator);
        res.status(201).json(savedOperator);
    } catch (error) {
        logger.error('Failed to create operator:', error);
        res.status(500).json({ error: 'Failed to create operator' });
    }
});

app.put('/api/operators/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const operator = await AppDataSource.getRepository(Operator).findOneBy({ id });
        if (operator) {
            AppDataSource.getRepository(Operator).merge(operator, req.body);
            const updatedOperator = await AppDataSource.getRepository(Operator).save(operator);
            res.json(updatedOperator);
        } else {
            res.status(404).json({ error: 'Operator not found' });
        }
    } catch (error) {
        logger.error('Failed to update operator:', error);
        res.status(500).json({ error: 'Failed to update operator' });
    }
});

app.delete('/api/operators/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const operator = await AppDataSource.getRepository(Operator).findOneBy({ id });
        if (operator) {
            await AppDataSource.getRepository(Operator).remove(operator);
            res.json({ message: 'Operator deleted successfully' });
        } else {
            res.status(404).json({ error: 'Operator not found' });
        }
    } catch (error) {
        logger.error('Failed to delete operator:', error);
        res.status(500).json({ error: 'Failed to delete operator' });
    }
});

app.get('/api/crops', verifyToken, async (req, res) => {
    try {
        const crops = await AppDataSource.getRepository(Crop).find({ relations: ['varieties'] });
        res.json(crops);
    } catch (error) {
        logger.error('Failed to fetch crops:', error);
        res.status(500).json({ error: 'Failed to fetch crops' });
    }
});

app.post('/api/crops', verifyToken, async (req, res) => {
    try {
        const crop = AppDataSource.getRepository(Crop).create(req.body);
        const savedCrop = await AppDataSource.getRepository(Crop).save(crop);
        res.status(201).json(savedCrop);
    } catch (error) {
        logger.error('Failed to create crop:', error);
        res.status(500).json({ error: 'Failed to create crop' });
    }
});

app.post('/api/crops/:cropId/varieties', verifyToken, async (req, res) => {
    try {
        const { cropId } = req.params;
        const crop = await AppDataSource.getRepository(Crop).findOneBy({ id: cropId });
        if (crop) {
            const variety = AppDataSource.getRepository(Variety).create({ ...req.body, crop });
            const savedVariety = await AppDataSource.getRepository(Variety).save(variety);
            res.status(201).json(savedVariety);
        } else {
            res.status(404).json({ error: 'Crop not found' });
        }
    } catch (error) {
        logger.error('Failed to create variety:', error);
        res.status(500).json({ error: 'Failed to create variety' });
    }
});

app.delete('/api/crops/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const crop = await AppDataSource.getRepository(Crop).findOne({
            where: { id },
            relations: ['varieties'],
        });
        if (crop) {
            await AppDataSource.getRepository(Crop).remove(crop);
            res.json({ message: 'Crop and its varieties deleted successfully' });
        } else {
            res.status(404).json({ error: 'Crop not found' });
        }
    } catch (error) {
        logger.error('Failed to delete crop and its varieties:', error);
        res.status(500).json({ error: 'Failed to delete crop and its varieties' });
    }
});

app.delete('/api/crops/:cropId/varieties/:varietyId', verifyToken, async (req, res) => {
    try {
        const { cropId, varietyId } = req.params;
        const variety = await AppDataSource.getRepository(Variety).findOneBy({
            id: varietyId,
            crop: { id: cropId },
        });
        if (variety) {
            await AppDataSource.getRepository(Variety).remove(variety);
            res.json({ message: 'Variety deleted successfully' });
        } else {
            res.status(404).json({ error: 'Variety not found' });
        }
    } catch (error) {
        logger.error('Failed to delete variety:', error);
        res.status(500).json({ error: 'Failed to delete variety' });
    }
});

app.get('/api/products', verifyToken, async (req, res) => {
    try {
        const products = await AppDataSource.getRepository(Product).find();
        res.json(products);
    } catch (error) {
        logger.error('Failed to fetch products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

app.post('/api/products', verifyToken, async (req, res) => {
    try {
        const { name, density, activeIngredient } = req.body;
        if (!name || !density) {
            res.status(400).json({ error: 'Name and density are required' });
        } else {
            const product = AppDataSource.getRepository(Product).create({
                name,
                density,
                activeIngredient,
            });
            const savedProduct = await AppDataSource.getRepository(Product).save(product);
            res.status(201).json(savedProduct);
        }
    } catch (error) {
        logger.error('Failed to create product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

app.delete('/api/products/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const product = await AppDataSource.getRepository(Product).findOneBy({ id });
        if (product) {
            await AppDataSource.getRepository(Product).remove(product);
            res.json({ message: 'Product deleted successfully' });
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        logger.error('Failed to delete product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
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

app.post('/api/register', registerUser);
app.post('/api/login', loginUser);
app.post('/api/logout', logoutUser);
app.post('/api/reset-password', resetPassword);
app.get('/api/user', verifyToken, async (req, res) => {
    try {
        const user = req.user;
        const operator = await AppDataSource.getRepository(Operator).findOneBy({
            firebaseUserId: user.uid,
        });
        if (operator) {
            res.status(200).json({
                email: operator.email,
                name: operator.name,
                surname: operator.surname,
                phone: operator.phone,
                roles: operator.roles,
            });
        } else {
            res.status(404).json({ error: 'Operator not found' });
        }
    } catch (error) {
        logger.error('Failed to fetch user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

interface OrderExecutionRequestBody {
    orderId: string;
    productExecutions: {
        productId: string;
        appliedRateKg?: number;
        applicationPhoto?: string;
        consumptionPhoto?: string;
    }[];
    applicationMethod?: string;
    packingPhoto?: string;
    consumptionPhoto?: string;
    packedseedsToTreatKg?: number;
    slurryConsumptionPerLotKg?: number;
    currentPage?: number;
    currentProductIndex?: number;
}

app.post(
    '/api/executions',
    verifyToken,
    async (req: express.Request<{}, {}, OrderExecutionRequestBody>, res) => {
        try {
            const {
                orderId,
                productExecutions,
                applicationMethod,
                packingPhoto,
                consumptionPhoto,
                packedseedsToTreatKg,
                slurryConsumptionPerLotKg,
                currentPage,
                currentProductIndex,
            } = req.body;
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
                        packingPhoto,
                        consumptionPhoto,
                        packedseedsToTreatKg,
                        slurryConsumptionPerLotKg,
                        currentPage,
                        currentProductIndex,
                    });
                    // Update or add product executions
                    for (const productExecutionData of productExecutions) {
                        let productExecution = orderExecution.productExecutions.find(
                            (pe) => pe.productId === productExecutionData.productId,
                        );
                        if (productExecution) {
                            Object.assign(productExecution, productExecutionData);
                        } else {
                            productExecution =
                                AppDataSource.getRepository(ProductExecution).create(
                                    productExecutionData,
                                );
                            orderExecution.productExecutions.push(productExecution);
                        }
                    }
                } else {
                    // Create new order execution
                    orderExecution = AppDataSource.getRepository(OrderExecution).create({
                        order,
                        operator,
                        productExecutions,
                        applicationMethod,
                        packingPhoto,
                        consumptionPhoto,
                        packedseedsToTreatKg,
                        slurryConsumptionPerLotKg,
                        currentPage,
                        currentProductIndex,
                    });
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

app.get('/api/executions/user-order-executions', verifyToken, async (req, res) => {
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

app.get('/api/executions/:orderId', verifyToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const orderExecution = await AppDataSource.getRepository(OrderExecution).findOne({
            where: { order: { id: orderId } },
            relations: ['productExecutions'],
        });

        if (orderExecution) {
            res.json(orderExecution);
        } else {
            res.status(404).json({ error: 'Order execution not found' });
        }
    } catch (error) {
        logger.error('Failed to fetch order execution:', error);
        res.status(500).json({ error: 'Failed to fetch order execution' });
    }
});

app.post('/api/calculate-order', verifyToken, async (req, res) => {
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

        const calculatedValues = createOrderRecipe(order);
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

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        logger.info(`Server is running on port ${port}`);
        logger.debug(`DB_HOST: ${process.env.DB_HOST}`);
        logger.debug(`DB_PORT: ${process.env.DB_PORT}`);
        logger.debug(`DB_USERNAME: ${process.env.DB_USERNAME}`);
        logger.debug(`DB_PASSWORD: ${process.env.DB_PASSWORD}`);
        logger.debug(`DB_NAME: ${process.env.DB_NAME}`);
        AppDataSource.initialize()
            .then(() => logger.info('Database connected'))
            .catch((err: any) => logger.error('Unable to connect to the database:', err));
    });
}

export default app;
