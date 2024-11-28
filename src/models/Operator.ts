import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum Role {
  OPERATOR = 'operator',
  ADMIN = 'admin',
  MANAGER = 'manager',
}

@Entity()
export class Operator {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  surname!: string;

  @Column()
  email!: string;

  @Column()
  birthday!: string;

  @Column()
  phone!: string;

  @Column()
  firebaseUserId!: string;

  @Column("simple-array")
  roles!: Role[];
}