import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne } from 'typeorm';
import { Company } from './Company';

@Entity()
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index()
    @Column()
    name!: string;

    @Column({ nullable: true })
    activeIngredient?: string;

    @Index()
    @Column('float')
    density!: number;

    @ManyToOne(() => Company, (company) => company.products, { nullable: false })
    company!: Company;
}
