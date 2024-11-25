import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Order } from './Order';
import { Product } from './Product';

@Entity()
export class ProductDetail {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Order, (order) => order.productDetails)
  order!: Order;

  @ManyToOne(() => Product)
  product!: Product;

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