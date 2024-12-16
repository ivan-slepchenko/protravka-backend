import { Order, Packaging } from "../models/Order";
import { RateType, RateUnit } from "../models/ProductDetail";

export const createOrderRecipe = (order: Order) => {
  
    //weight of the bag in kg, [I15]
  const unitWeight = order.packaging === Packaging.InKg ? order.bagSize : order.bagSize * order.tkw / 1000;
  
  const productRecipes = order.productDetails.map((productDetail) => {
    let rateMltoU_KS = 0;
    let rateGrToU_KS = 0;
    let rateMlTo100Kg = 0;
    let rateGrTo100Kg = 0;

    switch (productDetail.rateUnit) {
      case RateUnit.ML:
        switch (productDetail.rateType) {
          case RateType.Unit:
            rateMltoU_KS = productDetail.rate;
            rateGrToU_KS = rateMltoU_KS * productDetail.product.density;
            rateMlTo100Kg = 100 * rateMltoU_KS / unitWeight;
            rateGrTo100Kg = rateMlTo100Kg * productDetail.product.density;
            break;
          case RateType.Per100Kg:
            rateMlTo100Kg = productDetail.rate;
            rateMltoU_KS = unitWeight * rateMlTo100Kg / 100;
            rateGrToU_KS = rateMltoU_KS * productDetail.product.density;
            rateGrTo100Kg = rateMlTo100Kg * productDetail.product.density;
            break;
          default:
            throw new Error('Unknown rate unit');
        }
        break;
      case RateUnit.G:
        switch (productDetail.rateType) {
          case RateType.Unit:
            rateGrToU_KS = productDetail.rate;
            rateMltoU_KS = rateGrToU_KS / productDetail.product.density;
            rateGrTo100Kg = 100 * rateGrToU_KS / unitWeight;
            rateMlTo100Kg = rateGrTo100Kg / productDetail.product.density;
            break;
          case RateType.Per100Kg:
            rateGrTo100Kg = productDetail.rate;
            rateGrToU_KS = unitWeight * rateGrTo100Kg / 100;
            rateMltoU_KS = rateGrToU_KS / productDetail.product.density;
            rateMlTo100Kg = rateGrTo100Kg / productDetail.product.density;        
            break;
          default:
            throw new Error('Unknown rate unit');
        }
        break;
      default:
        throw new Error('Unknown rate unit');
    }

    const seedsKgToUseForSlurryEstimation = order.seedsToTreatKg + order.extraSlurry / 100 * order.seedsToTreatKg;
    const mlSlurryRecipeToMix = rateMlTo100Kg * seedsKgToUseForSlurryEstimation / 100;
    const grSlurryRecipeToMix = mlSlurryRecipeToMix * productDetail.product.density;

    return {
      productDetail,
      unitWeight,
      rateMltoU_KS,
      rateGrToU_KS,
      rateMlTo100Kg,
      rateGrTo100Kg,
      mlSlurryRecipeToMix,
      grSlurryRecipeToMix,
    };
  });

  const slurryTotalMltoU_KS = productRecipes.reduce((sum, recipe) => sum + recipe.rateMltoU_KS, 0);
  const slurryTotalGToU_KS = productRecipes.reduce((sum, recipe) => sum + recipe.rateGrToU_KS, 0);
  const slurryTotalMlTo100Kg = productRecipes.reduce((sum, recipe) => sum + recipe.rateMlTo100Kg, 0);
  const slurryTotalGTo100Kgs = productRecipes.reduce((sum, recipe) => sum + recipe.rateGrTo100Kg, 0);
  const slurryTotalMlRecipeToMix = productRecipes.reduce((sum, recipe) => sum + recipe.mlSlurryRecipeToMix, 0);
  const slurryTotalGrRecipeToMix = productRecipes.reduce((sum, recipe) => sum + recipe.grSlurryRecipeToMix, 0);

  const extraSlurryPipesAndPompFeedingMl = slurryTotalMlRecipeToMix * order.extraSlurry / 100;
  const totalCompoundsDensity = slurryTotalGToU_KS / slurryTotalMltoU_KS;
  const nbSeedsUnits = order.seedsToTreatKg / unitWeight;

  return {
    order,
    totalCompoundsDensity,
    slurryTotalMltoU_KS,
    slurryTotalGToU_KS,
    slurryTotalMlTo100Kg,
    slurryTotalGTo100Kgs,
    slurryTotalMlRecipeToMix,
    slurryTotalGrRecipeToMix,
    extraSlurryPipesAndPompFeedingMl,
    nbSeedsUnits,
    productRecipes,
  };
};