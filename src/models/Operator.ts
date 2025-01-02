import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { OperatorToOrderExecution } from './OperatorToOrderExecution';

export enum Role {
  OPERATOR = 'operator',
  ADMIN = 'admin',
  MANAGER = 'manager',
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

  @OneToOne(() => OperatorToOrderExecution, (operatorToOrderExecution) => operatorToOrderExecution.operator)
  operatorToOrderExecution!: OperatorToOrderExecution;
}