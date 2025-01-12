import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Operator } from './Operator';

export enum FeatureFlag {
    LABORATORY = 'laboratory',
}

@Entity()
export class Company {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @Column()
    contactEmail!: string;

    @Column("simple-array")
    featureFlags!: FeatureFlag[];

    @OneToMany(() => Operator, (operator) => operator.company)
    operators!: Operator[];
}
