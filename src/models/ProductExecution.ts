import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { OrderExecution } from './OrderExecution';

@Entity()
export class ProductExecution {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => OrderExecution, (orderExecution) => orderExecution.productExecutions)
    orderExecution!: OrderExecution;

    @Index()
    @Column()
    productId!: string;

    @Column('float')
    appliedRateKg!: number;

    @Column({ nullable: true })
    applicationPhoto!: string;

    @Column({ nullable: true })
    productConsumptionPerLotKg!: number;

    @Column({ nullable: true })
    consumptionPhoto!: string;
}
