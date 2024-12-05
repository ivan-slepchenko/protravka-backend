import { Order, Packaging } from "../models/Order";
import { RateType, RateUnit } from "../models/ProductDetail";

export const createOrderRecipe = (order: Order) => {
  
    //weight of the bag in kg, [I15]
  const unitWeight = order.packaging === Packaging.InKg ? order.bagSize : order.bagSize * order.tkw / 1000;
  
  const productRecipes = order.productDetails.map((productDetail) => {
    let rateMltoU_KS = 0;
    let rateGToU_KS = 0;
    let rateMlTo100Kg = 0;
    let rateGTo100Kg = 0;

    switch (productDetail.rateUnit) {
      case RateUnit.ML:
        switch (productDetail.rateType) {
          case RateType.Unit:
            rateMltoU_KS = productDetail.rate;
            rateGToU_KS = rateMltoU_KS * productDetail.product.density;
            rateMlTo100Kg = 100 * rateMltoU_KS / unitWeight;
            rateGTo100Kg = rateMlTo100Kg * productDetail.product.density;
            break;
          case RateType.Per100Kg:
            rateMlTo100Kg = productDetail.rate;
            rateMltoU_KS = unitWeight * rateMlTo100Kg / 100;
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
            rateGToU_KS = productDetail.rate;
            rateMltoU_KS = rateGToU_KS / productDetail.product.density;
            rateGTo100Kg = rateGToU_KS / (unitWeight * 100);
            rateMlTo100Kg = rateGTo100Kg / productDetail.product.density;
            break;
          case RateType.Per100Kg:
            rateGTo100Kg = productDetail.rate;
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

    return {
      productDetail,
      rateMltoU_KS,
      rateGToU_KS,
      rateMlTo100Kg,
      rateGTo100Kg,
      literSlurryRecipeToMix,
      kgSlurryRecipeToWeight,
    };
  });

  const slurryTotalMltoU_KS = productRecipes.reduce((sum, recipe) => sum + recipe.rateMltoU_KS, 0);
  const slurryTotalGToU_KS = productRecipes.reduce((sum, recipe) => sum + recipe.rateGToU_KS, 0);
  const slurryTotalMlTo100Kg = productRecipes.reduce((sum, recipe) => sum + recipe.rateMlTo100Kg, 0);
  const slurryTotalGTo100Kgs = productRecipes.reduce((sum, recipe) => sum + recipe.rateGTo100Kg, 0);
  const slurryTotalMlRecipeToMix = productRecipes.reduce((sum, recipe) => sum + recipe.literSlurryRecipeToMix, 0);
  const slurryTotalKgRecipeToWeight = productRecipes.reduce((sum, recipe) => sum + recipe.kgSlurryRecipeToWeight, 0);
  
  let extraSlurryPipesAndPompFeedingMl = slurryTotalMlRecipeToMix * order.extraSlurry / 100;
  let totalCompoundsDensity = slurryTotalGToU_KS / slurryTotalMltoU_KS;
  let nbSeedsUnits = order.quantity / unitWeight;

  return {
    order,
    totalCompoundsDensity,
    slurryTotalMltoU_KS,
    slurryTotalGToU_KS,
    slurryTotalMlTo100Kg,
    slurryTotalGTo100Kgs,
    slurryTotalMlRecipeToMix,
    slurryTotalKgRecipeToWeight,
    extraSlurryPipesAndPompFeedingMl,
    nbSeedsUnits,
    productRecipes,
  };
};