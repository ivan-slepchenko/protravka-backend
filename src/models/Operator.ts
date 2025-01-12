import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import { OrderExecution } from './OrderExecution';
import { Company } from './Company';

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

  @OneToMany(() => OrderExecution, (orderExecution) => orderExecution.operator)
  orderExecutions!: OrderExecution[];

  @ManyToOne(() => Company, (company) => company.operators, { nullable: true })
  company?: Company;
}