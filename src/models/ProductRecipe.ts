
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
    rateGToU_KS!: number;

    @Column('float')
    rateMlTo100Kg!: number;

    @Column('float')
    rateGTo100Kg!: number;

    @Column('float')
    literSlurryRecipeToMix!: number;

    @Column('float')
    kgSlurryRecipeToMix!: number;
}