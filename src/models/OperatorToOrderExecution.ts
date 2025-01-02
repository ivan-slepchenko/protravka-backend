import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { OrderExecution } from './OrderExecution';
import { Operator } from './Operator';

@Entity()
export class OperatorToOrderExecution {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Operator, (operator) => operator.operatorToOrderExecution)
  @JoinColumn()
  operator!: Operator;

  @OneToOne(() => OrderExecution)
  @JoinColumn()
  orderExecution!: OrderExecution;

  @Column()
  currentPage!: string;

  @Column()
  currentOrderId!: string;

  @Column('int')
  currentProductIndex!: number;
}
