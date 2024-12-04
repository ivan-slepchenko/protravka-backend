import { Order } from "../models/Order";
import { ProductDetail, RateType, RateUnit } from "../models/ProductDetail";

export interface ProductRecipe {
    productDetail: ProductDetail;
    rateMltoU_KS: number;
    rateGToU_KS: number;
    rateMlTo100Kg: number;
    rateGTo100Kg: number;
    literSlurryRecipeToMix: number;
    kgSlurryRecipeToWeight: number;
    extraSlurryPipesAndPompFeeding: number;
}

export interface OrderRecipe {
    order: Order;
    totalCompoundsDensity: number; //I22/H22
    slurryTotalMltoU_KS: number; //SUM(H17:H21)
    slurryTotalGToU_KS: number; //SUM(I17:I21)
    slurryTotalMlTo100g: number; //SUM(K17:K21)
    slurryTotalGTo100Kgs: number; //SUM(L17:L21)
    slurryTotalLiterRecipeToMix: number; //SUM(M17:M21)
    slurryTotalKgRecipeToWeight: number; //SUM(N17:N21)

    nbSeedsUnits: number; //O6/I15

    productRecipes: ProductRecipe[];
}

export const calculateRecipe = (order: Order): OrderRecipe => {
    const productRecipes: ProductRecipe[] = order.productDetails.map((productDetail) => {
        const unitWeight = order.bagSize * order.tkw / 1000;

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

        let extraSlurryNeeded = 0;

        let seedSlurryToPrepare = order.quantity + order.quantity * 0;

        let literSlurryRecipeToMix = rateMlTo100Kg * seedSlurryToPrepare / 100;
        let kgSlurryRecipeToWeight = 0; //N17*F17
        let extraSlurryPipesAndPompFeeding = 0; //(N22*O10)

        return {
            productDetail,
            rateMltoU_KS,
            rateGToU_KS,
            rateMlTo100Kg,
            rateGTo100Kg,
            literSlurryRecipeToMix,
            kgSlurryRecipeToWeight,
            extraSlurryPipesAndPompFeeding,
        };
    });

    return {
        order,
        totalCompoundsDensity: 0,
        slurryTotalMltoU_KS: 0,
        slurryTotalGToU_KS: 0,
        slurryTotalMlTo100g: 0,
        slurryTotalGTo100Kgs: 0,
        slurryTotalLiterRecipeToMix: 0,
        slurryTotalKgRecipeToWeight: 0,
        nbSeedsUnits: 0,
        productRecipes,
    };
};