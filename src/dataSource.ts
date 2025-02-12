import { DataSource } from 'typeorm';
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
    ],
    synchronize: true,
});
