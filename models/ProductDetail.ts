
import { Table, Column, Model, DataType, ForeignKey } from 'sequelize-typescript';
import { Order } from './Order';

@Table
export class ProductDetail extends Model {
  @ForeignKey(() => Order)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  orderId!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  quantity!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  rateUnit!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  rateType!: string;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  density!: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  rate!: number;
}