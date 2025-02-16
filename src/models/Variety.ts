import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Crop } from './Crop';
import { Company } from './Company';

@Entity()
export class Variety {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @ManyToOne(() => Crop, (crop) => crop.varieties)
    crop!: Crop;

    @ManyToOne(() => Company, (company) => company.varieties)
    company!: Company;
}
