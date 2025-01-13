import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, OneToOne } from 'typeorm';
import { ProductDetail } from './ProductDetail';
import { Operator } from './Operator';
import { Crop } from './Crop';
import { Variety } from './Variety';
import { OrderExecution } from './OrderExecution';
import { OrderRecipe } from './OrderRecipe';

export enum OrderStatus {
    ForLabToInitiate = 'For Lab To Initiate',
    ByLabInitiated = 'By Lab Initiated',
    ReadyToStart = 'Ready To Start',
    InProgress = 'In Progress',
    ForLabToControl = 'For Lab To Control',
    ToAcknowledge = 'To Acknowledge',
    Archived = 'Archived',
    Completed = "Completed",
    Failed = "Failed",
}

export enum Packaging {
  InSeeds = 'inSeeds',
  InKg = 'inKg',
}

@Entity()
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    lotNumber!: string;

    @Column({
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.ReadyToStart,
    })
    status!: OrderStatus;

    @Column({ nullable: true })
    recipeDate?: string;

    @Column({ nullable: true })
    applicationDate?: string;

    @ManyToOne(() => Operator, { eager: true, nullable: true })
    operator?: Operator | null;

    @ManyToOne(() => Crop, { eager: true })
    crop!: Crop;

    @ManyToOne(() => Variety, { eager: true })
    variety!: Variety;

    /**
     * The thousand kernel weight in grams.
     * In the spreadsheet, [I10].
     */
    @Column('float', { nullable: true })
    tkw?: number;

    /**
     * The seedsToTreatKg of the order in kilograms.
     * In the spreadsheet, [O6].
     */
    @Column('float')
    seedsToTreatKg!: number;

    /**
     * The extra slurry percentage.
     * In the spreadsheet, [O10].
     */
    @Column('float', { nullable: true })
    extraSlurry?: number;

    /**
     * The packaging type.
     * Not represented in the spreadsheet.
     */
    @Column({
        type: 'enum',
        enum: Packaging,
        default: Packaging.InSeeds,
        nullable: true,
    })
    packaging?: Packaging;

    /**
     * The size of the bag in kilograms or in thousand of seeds, depends on the packaging.
     * In the spreadsheet, [L10].
     */
    @Column('float', { nullable: true })
    bagSize?: number;

    @OneToMany(() => ProductDetail, (productDetail) => productDetail.order, { cascade: true })
    productDetails!: ProductDetail[];

    @OneToOne(() => OrderExecution, (orderExecution) => orderExecution.order, { cascade: true, nullable: true })
    orderExecution?: OrderExecution;

    @OneToOne(() => OrderRecipe, (orderRecipe) => orderRecipe.order, { cascade: true, nullable: true })
    orderRecipe?: OrderRecipe;
}