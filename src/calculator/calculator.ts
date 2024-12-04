import { Order } from "../models/Order";
import { RateType, RateUnit } from "../models/ProductDetail";
import { OrderRecipe } from "../models/OrderRecipe";
import { ProductRecipe } from "../models/ProductRecipe";
import { AppDataSource } from "../index"; // Import the data source

export const createOrderRecipe = (order: Order): OrderRecipe => {
    const unitWeight = order.bagSize * order.tkw / 1000;
    const productRecipes: ProductRecipe[] = order.productDetails.map((productDetail) => {

        let rateMltoU_KS = 0;
        let rateGToU_KS = 0;
        let rateMlTo100Kg = 0;
        let rateGTo100Kg = 0;

        switch (productDetail.rateUnit) {
            case RateUnit.ML:
                switch (productDetail.rateType) {
                    case RateType.Unit:
                        rateMltoU_KS = productDetail.quantity;
                        rateGToU_KS = rateMltoU_KS * productDetail.product.density;
                        rateMlTo100Kg = rateMltoU_KS / (unitWeight * 100);
                        rateGTo100Kg = rateMlTo100Kg * productDetail.product.density;
                        break;
                    case RateType.Per100Kg:
                        rateMlTo100Kg = productDetail.quantity;
                        rateMltoU_KS = rateMlTo100Kg / 100 * unitWeight;
                        rateGToU_KS = rateMltoU_KS * productDetail.product.density;
                        rateGTo100Kg = rateMlTo100Kg * productDetail.product.density;
                        break;
                    default:
                        throw new Error('Unknown rate unit');
                }
                break;
            case RateUnit.G:
                switch (productDetail.rateType) {
                    case RateType.Unit:
                        rateGToU_KS = productDetail.quantity;
                        rateMltoU_KS = rateGToU_KS / productDetail.product.density;
                        rateGTo100Kg = rateGToU_KS / (unitWeight * 100);
                        rateMlTo100Kg = rateGTo100Kg / productDetail.product.density;
                        break;
                    case RateType.Per100Kg:
                        rateGTo100Kg = productDetail.quantity;
                        rateGToU_KS = rateGTo100Kg / 100 * unitWeight;
                        rateMltoU_KS = rateGToU_KS / productDetail.product.density;
                        rateMlTo100Kg = rateGTo100Kg / productDetail.product.density;        
                        break;
                    default:
                        throw new Error('Unknown rate unit');
                }
                break;
            default:
                throw new Error('Unknown rate unit');
        }

        
        let seedsSlurryToPrepareKg = order.quantity + order.extraSlurry / 100 * order.quantity;
        let literSlurryRecipeToMix = rateMlTo100Kg * seedsSlurryToPrepareKg / 100;
        let kgSlurryRecipeToWeight = literSlurryRecipeToMix * productDetail.product.density;

        return AppDataSource.getRepository(ProductRecipe).create({
            productDetail,
            rateMltoU_KS,
            rateGToU_KS,
            rateMlTo100Kg,
            rateGTo100Kg,
            literSlurryRecipeToMix,
            kgSlurryRecipeToWeight,
        });
    });


    const slurryTotalMltoU_KS = productRecipes.reduce((sum, recipe) => sum + recipe.rateMltoU_KS, 0);
    const slurryTotalGToU_KS = productRecipes.reduce((sum, recipe) => sum + recipe.rateGToU_KS, 0);
    const slurryTotalMlTo100g = productRecipes.reduce((sum, recipe) => sum + recipe.rateMlTo100Kg, 0);
    const slurryTotalGTo100Kgs = productRecipes.reduce((sum, recipe) => sum + recipe.rateGTo100Kg, 0);
    const slurryTotalMlRecipeToMix = productRecipes.reduce((sum, recipe) => sum + recipe.literSlurryRecipeToMix, 0);
    const slurryTotalKgRecipeToWeight = productRecipes.reduce((sum, recipe) => sum + recipe.kgSlurryRecipeToWeight, 0);
    let extraSlurryPipesAndPompFeedingMl = slurryTotalMlRecipeToMix * order.extraSlurry / 100;
    let totalCompoundsDensity = slurryTotalGToU_KS / slurryTotalMltoU_KS;
    let nbSeedsUnits = order.quantity / unitWeight;

    return AppDataSource.getRepository(OrderRecipe).create({
        order,
        totalCompoundsDensity,
        slurryTotalMltoU_KS,
        slurryTotalGToU_KS,
        slurryTotalMlTo100g,
        slurryTotalGTo100Kgs,
        slurryTotalMlRecipeToMix,
        slurryTotalKgRecipeToWeight,
        extraSlurryPipesAndPompFeedingMl,
        nbSeedsUnits,
        productRecipes,
    });
};