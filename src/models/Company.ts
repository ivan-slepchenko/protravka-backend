import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Crop } from './Crop';
import { Operator } from './Operator';
import { Product } from './Product';
import { Variety } from './Variety';
import { Order } from './Order';

@Entity()
export class Company {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @Column()
    contactEmail!: string;

    @Column()
    featureFlags!: string;

    @OneToMany(() => Crop, (crop) => crop.company)
    crops!: Crop[];

    @OneToMany(() => Operator, (operator) => operator.company)
    operators!: Operator[];

    @OneToMany(() => Product, (product) => product.company)
    products!: Product[];

    @OneToMany(() => Variety, (variety) => variety.company)
    varieties!: Variety[];

    @OneToMany(() => Order, (order) => order.company)
    orders!: Order[];
}
