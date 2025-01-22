import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    OneToOne,
    JoinColumn,
    ManyToOne,
    Index,
} from 'typeorm';
import { Order } from './Order';
import { ProductExecution } from './ProductExecution';
import { Operator } from './Operator';
import { TkwMeasurement } from './TkwMeasurement';

@Entity()
export class OrderExecution {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @OneToOne(() => Order, (order) => order.orderExecution)
    @JoinColumn() // Specify that OrderExecution owns the relationship with Order
    order!: Order;

    @Index()
    @ManyToOne(() => Operator, (operator) => operator.orderExecutions)
    operator!: Operator;

    @OneToMany(() => ProductExecution, (productExecution) => productExecution.orderExecution, {
        cascade: true,
    })
    productExecutions!: ProductExecution[];

    @OneToMany(() => TkwMeasurement, (tkwMeasurement) => tkwMeasurement.orderExecution, {
        cascade: true,
    })
    tkwMeasurements!: TkwMeasurement[];

    @Column({ nullable: true })
    applicationMethod!: string;

    @Column({ nullable: true })
    packingPhoto!: string;

    @Column({ nullable: true })
    consumptionPhoto!: string;

    @Column('float', { nullable: true })
    packedseedsToTreatKg!: number;

    @Column('float', { nullable: true })
    slurryConsumptionPerLotKg!: number;

    @Column({ nullable: true })
    currentPage!: number;

    @Column('int', { nullable: true })
    currentProductIndex!: number;

    @Column('float', { nullable: true })
    treatmentStart?: number;
}
