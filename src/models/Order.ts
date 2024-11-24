import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import { ProductDetail } from './ProductDetail';
import { Operator } from './Operator';
import { Crop } from './Crop';
import { Variety } from './Variety';

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

  @ManyToOne(() => Crop, { eager: true })
  crop!: Crop;

  @ManyToOne(() => Variety, { eager: true })
  variety!: Variety;

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