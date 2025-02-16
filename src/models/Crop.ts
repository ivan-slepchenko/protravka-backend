import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    BeforeRemove,
    ManyToOne,
} from 'typeorm';
import { Variety } from './Variety';
import { Company } from './Company';
import { AppDataSource } from '..';

@Entity()
export class Crop {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @OneToMany(() => Variety, (variety) => variety.crop, { cascade: true })
    varieties!: Variety[];

    @ManyToOne(() => Company, (company) => company.crops, { nullable: false })
    company!: Company;

    @BeforeRemove()
    async removeVarieties() {
        const varietyRepository = AppDataSource.getRepository(Variety);
        await varietyRepository.delete({ crop: { id: this.id } });
    }
}
