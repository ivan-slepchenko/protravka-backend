import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ProductDetail } from './ProductDetail';

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

  @Column()
  operator!: string;

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

  @OneToMany(() => ProductDetail, (productDetail) => productDetail.order)
  productDetails!: ProductDetail[];
}