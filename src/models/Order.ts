import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    ManyToOne,
    OneToOne,
    Index,
} from 'typeorm';
import { ProductDetail } from './ProductDetail';
import { Operator } from './Operator';
import { Crop } from './Crop';
import { Variety } from './Variety';
import { OrderExecution } from './OrderExecution';
import { OrderRecipe } from './OrderRecipe';
import { Company } from './Company';

export enum OrderStatus {
    LabAssignmentCreated = 'Lab Assignment Created',
    TKWConfirmed = 'TKW Confirmed',
    RecipeCreated = 'Recipe Created',
    TreatmentInProgress = 'Treatment In Progress',
    PackingInProgress = 'Packing In Progress',
    LabToControl = 'Lab To Control',
    ToAcknowledge = 'To Acknowledge',
    Archived = 'Archived',
    Completed = 'Completed',
    Failed = 'Failed',
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

    @Index()
    @Column({
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.RecipeCreated,
    })
    status!: OrderStatus;

    @Index()
    @ManyToOne(() => Operator, { eager: true, nullable: true })
    operator?: Operator | null;

    @ManyToOne(() => Crop, { eager: true })
    crop!: Crop;

    @ManyToOne(() => Variety, { eager: true })
    variety!: Variety;

    @ManyToOne(() => Company, (company) => company.orders)
    company!: Company;

    @Column('float', { nullable: true })
    tkw?: number;

    @Column('float', { nullable: true })
    tkwRep1?: number;

    @Column('float', { nullable: true })
    tkwRep2?: number;

    @Column('float', { nullable: true })
    tkwRep3?: number;

    @Column('float')
    seedsToTreatKg!: number;

    @Column('float', { nullable: true })
    extraSlurry?: number;

    @Column({
        type: 'enum',
        enum: Packaging,
        default: Packaging.InSeeds,
        nullable: true,
    })
    packaging?: Packaging;

    @Column('float', { nullable: true })
    bagSize?: number;

    @Column('text', { nullable: true })
    tkwProbesPhoto?: string;

    @Column('int', { default: 60 })
    tkwMeasurementInterval!: number;

    @OneToMany(() => ProductDetail, (productDetail) => productDetail.order, { cascade: true })
    productDetails!: ProductDetail[];

    @OneToOne(() => OrderExecution, (orderExecution) => orderExecution.order, {
        cascade: true,
        nullable: true,
    })
    orderExecution?: OrderExecution;

    @OneToOne(() => OrderRecipe, (orderRecipe) => orderRecipe.order, {
        cascade: true,
        nullable: true,
    })
    orderRecipe?: OrderRecipe;

    @Column('float', { nullable: true })
    tkwMeasurementDate?: number;

    @Index()
    @Column('float', { nullable: true })
    creationDate?: number;

    @Index()
    @Column('float', { nullable: true })
    applicationDate?: number;

    @Column('float', { nullable: true })
    finalizationDate?: number;

    @Column('float', { nullable: true })
    completionDate?: number;
}
