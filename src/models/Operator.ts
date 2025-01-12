import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import { OrderExecution } from './OrderExecution';

export enum Role {
  OPERATOR = 'operator',
  ADMIN = 'admin',
  MANAGER = 'manager',
  LABORATORY_ASSISTANT = 'laboratory_assistant',
}

@Entity()
export class Operator {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  surname!: string;

  @Column()
  email!: string;

  @Column()
  birthday!: string;

  @Column()
  phone!: string;

  @Column()
  firebaseUserId!: string;

  @Column("simple-array")
  roles!: Role[];

  @OneToMany(() => OrderExecution, (orderExecution) => orderExecution.operator)
  orderExecutions!: OrderExecution[];
}