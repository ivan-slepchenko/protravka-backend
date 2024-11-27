import { Entity, PrimaryGeneratedColumn, Column, OneToMany, BeforeRemove } from 'typeorm';
import { Variety } from './Variety';
import { AppDataSource } from '..';

@Entity()
export class Crop {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @OneToMany(() => Variety, (variety) => variety.crop, { cascade: true })
  varieties!: Variety[];

  @BeforeRemove()
  async removeVarieties() {
    const varietyRepository = AppDataSource.getRepository(Variety);
    await varietyRepository.delete({ crop: { id: this.id } });
  }
}