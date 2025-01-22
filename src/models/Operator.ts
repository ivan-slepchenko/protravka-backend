import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index } from 'typeorm';
import { OrderExecution } from './OrderExecution';

export enum Role {
    OPERATOR = 'operator',
    ADMIN = 'admin',
    MANAGER = 'manager',
    LABORATORY = 'laboratory',
}

@Entity()
export class Operator {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column()
    name!: string;

    @Index()
    @Column()
    surname!: string;

    @Index()
    @Column()
    email!: string;

    @Column()
    birthday!: string;

    @Column()
    phone!: string;

    @Index()
    @Column()
    firebaseUserId!: string;

    @Column('simple-array')
    roles!: Role[];

    @OneToMany(() => OrderExecution, (orderExecution) => orderExecution.operator)
    orderExecutions!: OrderExecution[];
}
