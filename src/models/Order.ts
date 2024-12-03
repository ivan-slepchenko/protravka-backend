import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, OneToOne } from 'typeorm';
import { ProductDetail } from './ProductDetail';
import { Operator } from './Operator';
import { Crop } from './Crop';
import { Variety } from './Variety';
import { OrderExecution } from './OrderExecution';

export enum OrderStatus {
  NotStarted = 'Not Started',
  InProgress = 'In Progress',
  Acknowledge = 'Acknowledge',
  Archived = 'Archived',
  Executed = "Executed",
}

@Entity()
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  lotNumber!: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.NotStarted,
  })
  status!: OrderStatus;

  @Column()
  recipeDate!: string;

  @Column()
  applicationDate!: string;

  @ManyToOne(() => Operator, { eager: true })
  operator!: Operator;

  @ManyToOne(() => Crop, { eager: true })
  crop!: Crop;

  @ManyToOne(() => Variety, { eager: true })
  variety!: Variety;

  @Column('float')
  tkw!: number;

  @Column('float')
  quantity!: number;

  @Column()
  packaging!: string;

  @Column('float')
  bagSize!: number;

  @OneToMany(() => ProductDetail, (productDetail) => productDetail.order, { cascade: true })
  productDetails!: ProductDetail[];

  @OneToOne(() => OrderExecution, (orderExecution) => orderExecution.order, { cascade: true })
  orderExecution!: OrderExecution;
}