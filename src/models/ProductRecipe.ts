
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ProductDetail } from './ProductDetail';
import { OrderRecipe } from './OrderRecipe';

@Entity()
export class ProductRecipe {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => ProductDetail, { eager: true })
    productDetail!: ProductDetail;

    @ManyToOne(() => OrderRecipe, (orderRecipe) => orderRecipe.productRecipes)
    orderRecipe!: OrderRecipe;

    @Column('float')
    rateMltoU_KS!: number;

    @Column('float')
    rateGrToU_KS!: number;

    @Column('float')
    rateMlTo100Kg!: number;

    @Column('float')
    rateGrTo100Kg!: number;

    @Column('float')
    mlSlurryRecipeToMix!: number;

    @Column('float')
    grSlurryRecipeToMix!: number;
}