
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany } from 'typeorm';
import { Order } from './Order';
import { ProductRecipe } from './ProductRecipe';

@Entity()
export class OrderRecipe {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @OneToOne(() => Order, (order) => order.orderRecipe)
    order!: Order;

    @Column('float')
    totalCompoundsDensity!: number;

    @Column('float')
    slurryTotalMltoU_KS!: number;

    @Column('float')
    slurryTotalGToU_KS!: number;

    @Column('float')
    slurryTotalMlTo100g!: number;

    @Column('float')
    slurryTotalGTo100Kgs!: number;

    @Column('float')
    slurryTotalMlRecipeToMix!: number;

    @Column('float')
    slurryTotalKgRecipeToWeight!: number;

    @Column('float')
    extraSlurryPipesAndPompFeedingMl!: number;

    @Column('float')
    nbSeedsUnits!: number;

    @OneToMany(() => ProductRecipe, (productRecipe) => productRecipe.orderRecipe, { cascade: true })
    productRecipes!: ProductRecipe[];
}