
import { Table, Column, Model, DataType } from 'sequelize-typescript';

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

  // Add other fields as necessary
}