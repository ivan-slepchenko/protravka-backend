
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Operator {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  surname!: string;
}