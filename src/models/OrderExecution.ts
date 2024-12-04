import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { Order } from './Order';
import { ProductExecution } from './ProductExecution';

@Entity()
export class OrderExecution {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Order, (order) => order.orderExecution)
  @JoinColumn() // Specify that OrderExecution owns the relationship with Order
  order!: Order;

  @OneToMany(() => ProductExecution, (productExecution) => productExecution.orderExecution, { cascade: true })
  productExecutions!: ProductExecution[];

  @Column({ nullable: true })
  applicationMethod!: string;

  @Column({ nullable: true })
  packingPhoto!: string;

  @Column({ nullable: true })
  consumptionPhoto!: string;

  @Column('float', { nullable: true })
  packedQuantity!: number;
}