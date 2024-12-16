import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { Order } from './Order';
import { ProductRecipe } from './ProductRecipe';

@Entity()
export class OrderRecipe {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @OneToOne(() => Order, (order) => order.orderRecipe)
    @JoinColumn() // Specify that OrderRecipe owns the relationship with Order
    order!: Order;

    @Column('float')
    totalCompoundsDensity!: number;

    @Column('float')
    slurryTotalMltoU_KS!: number;

    @Column('float')
    slurryTotalGToU_KS!: number;

    @Column('float')
    slurryTotalMlTo100Kg!: number;

    @Column('float')
    slurryTotalGTo100Kgs!: number;

    @Column('float')
    slurryTotalMlRecipeToMix!: number;

    @Column('float')
    slurryTotalGrRecipeToMix!: number;

    @Column('float')
    extraSlurryPipesAndPompFeedingMl!: number;

    @Column('float')
    nbSeedsUnits!: number;

    @Column('float')
    unitWeight!: number;

    @OneToMany(() => ProductRecipe, (productRecipe) => productRecipe.orderRecipe, { cascade: true })
    productRecipes!: ProductRecipe[];
}