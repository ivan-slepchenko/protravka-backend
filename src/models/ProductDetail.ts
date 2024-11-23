import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Order } from './Order';

@Entity()
export class ProductDetail {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Order, (order) => order.productDetails)
  order!: Order;

  @Column()
  name!: string;

  @Column('float')
  quantity!: number;

  @Column()
  rateUnit!: string;

  @Column()
  rateType!: string;

  @Column('float')
  density!: number;

  @Column('float')
  rate!: number;

  @Column('int')
  index!: number; // Add index column
}