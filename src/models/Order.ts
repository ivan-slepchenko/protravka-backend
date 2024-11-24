import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import { ProductDetail } from './ProductDetail';
import { Operator } from './Operator';

@Entity()
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  lotNumber!: string;

  @Column()
  status!: string;

  @Column()
  recipeDate!: string;

  @Column()
  applicationDate!: string;

  @ManyToOne(() => Operator, { eager: true })
  operator!: Operator;

  @Column()
  crop!: string;

  @Column()
  variety!: string;

  @Column('float')
  tkw!: number;

  @Column('float')
  quantity!: number;

  @Column()
  packaging!: string;

  @Column('float')
  bagSize!: number;

  @OneToMany(() => ProductDetail, (productDetail) => productDetail.order, { cascade: true })
  productDetails!: ProductDetail[];
}