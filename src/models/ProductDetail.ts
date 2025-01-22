import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Order } from './Order';
import { Product } from './Product';

export enum RateUnit {
    ML = 'ml',
    G = 'g',
}

export enum RateType {
    Unit = 'unit',
    Per100Kg = '100kg',
}

@Entity()
export class ProductDetail {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => Order, (order) => order.productDetails)
    order!: Order;

    @ManyToOne(() => Product)
    product!: Product;

    @Column({
        type: 'enum',
        enum: RateUnit,
    })
    rateUnit!: RateUnit;

    @Column({
        type: 'enum',
        enum: RateType,
    })
    rateType!: RateType;

    @Column('float')
    rate!: number;

    @Column('int')
    index!: number; // Add index column
}
