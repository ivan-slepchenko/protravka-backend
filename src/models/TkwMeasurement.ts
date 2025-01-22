import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { OrderExecution } from './OrderExecution';

@Entity()
export class TkwMeasurement {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column()
    creationDate!: Date;

    @Index()
    @Column({ nullable: true })
    probeDate?: Date;

    @ManyToOne(() => OrderExecution, (orderExecution) => orderExecution.tkwMeasurements)
    orderExecution!: OrderExecution;

    @Column('float', { nullable: true })
    tkwProbe1?: number;

    @Column('float', { nullable: true })
    tkwProbe2?: number;

    @Column('float', { nullable: true })
    tkwProbe3?: number;

    @Column('text', { nullable: true })
    tkwProbesPhoto?: string;
}
