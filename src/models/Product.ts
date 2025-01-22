import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

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
}
