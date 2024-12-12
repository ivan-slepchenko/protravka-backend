
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { OrderExecution } from './OrderExecution';

@Entity()
export class ProductExecution {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => OrderExecution, (orderExecution) => orderExecution.productExecutions)
  orderExecution!: OrderExecution;

  @Column()
  productId!: string;

  @Column('float')
  appliedseedsToTreatKg!: number;

  @Column({ nullable: true })
  applicationPhoto!: string;

  @Column({ nullable: true })
  consumptionPhoto!: string;
}