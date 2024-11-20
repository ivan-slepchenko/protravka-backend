import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { ProductDetail } from './ProductDetail';

@Table
export class Order extends Model {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  lotNumber!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  status!: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  recipeDate!: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  applicationDate!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  operator!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  crop!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  variety!: string;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  tkw!: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  quantity!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  packaging!: string;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  bagSize!: number;

  @HasMany(() => ProductDetail)
  productDetails!: ProductDetail[];
}