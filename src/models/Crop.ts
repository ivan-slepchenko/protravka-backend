
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Variety } from './Variety';

@Entity()
export class Crop {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @OneToMany(() => Variety, (variety) => variety.crop, { cascade: true })
  varieties!: Variety[];
}