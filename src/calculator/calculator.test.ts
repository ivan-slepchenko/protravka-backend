import { createOrderRecipe } from './calculator';
import { RateType, RateUnit } from '../models/ProductDetail';
import { Order, OrderStatus, Packaging } from '../models/Order';
import { Product } from '../models/Product';
import { Operator } from '../models/Operator';
import { Crop } from '../models/Crop';
import { Variety } from '../models/Variety';
import { OrderExecution } from '../models/OrderExecution';
import { OrderRecipe } from '../models/OrderRecipe';

jest.mock('../models/Operator');
jest.mock('../models/Crop');
jest.mock('../models/Variety');
jest.mock('../models/OrderExecution');
jest.mock('../models/OrderRecipe');

const products = {
  water: {
    id: 'water',
    name: 'Water',
    density: 1.000,
    activeIngredient: 'H2O',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Product,
  maximXL035: {
    id: 'maximXL035',
    name: 'Maxim XL 035',
    density: 1.040,
    activeIngredient: 'Fludioxonil',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Product,
  apronXL: {
    id: 'apronXL',
    name: 'Apron XL',
    density: 1.100,
    activeIngredient: 'Metalaxyl-M',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Product,
  cruiser350FS: {
    id: 'cruiser350FS',
    name: 'Cruiser 350 FS',
    density: 1.179,
    activeIngredient: 'Thiamethoxam',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Product,
  sepiret6383: {
    id: 'sepiret6383',
    name: 'Sepiret 6383',
    density: 1.390,
    activeIngredient: 'Colorant',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Product,
};

describe('createOrderRecipe', () => {
  it('should create an order recipe data correctly', () => {
    const order: Order = {
      id: 'order1',
      packaging: Packaging.InSeeds,
      bagSize: 150,
      tkw: 63,
      seedsToTreatKg: 1000,
      extraSlurry: 10,
      productDetails: [
        {
            id: 'productDetail1',
            index: 0,
            product: products.water,
            rate: 270,
            rateUnit: RateUnit.ML,
            rateType: RateType.Per100Kg,
            order: {} as Order,
        },
        {
            id: 'productDetail2',
            index: 1,
            product: products.maximXL035,
            rate: 500,
            rateUnit: RateUnit.ML,
            rateType: RateType.Per100Kg,
            order: {} as Order,
        },
        {
            id: 'productDetail3',
            index: 2,
            product: products.apronXL,
            rate: 300,
            rateUnit: RateUnit.ML,
            rateType: RateType.Per100Kg,
            order: {} as Order,
        },
        {
            id: 'productDetail4',
            index: 3,
            product: products.cruiser350FS,
            rate: 111,
            rateUnit: RateUnit.ML,
            rateType: RateType.Unit,
            order: {} as Order,
        },
        {
            id: 'productDetail5',
            index: 4,
            product: products.sepiret6383,
            rate: 500,
            rateUnit: RateUnit.G,
            rateType: RateType.Per100Kg,
            order: {} as Order,
        },
      ],
      lotNumber: 'lot1',
      status: OrderStatus.ReadyToStart,
      recipeDate: new Date().toISOString(),
      applicationDate: new Date().toISOString(),
      operator: new Operator(),
      crop: new Crop(),
      variety: new Variety(),
      orderExecution: new OrderExecution(),
      orderRecipe: new OrderRecipe(),
    };

    const orderRecipeData = createOrderRecipe(order);

    expect(orderRecipeData).toBeDefined();
    expect(orderRecipeData.order.id).toBe(order.id);
    expect(orderRecipeData.totalCompoundsDensity).toBeCloseTo(1.154, 3);
    expect(orderRecipeData.slurryTotalMltoU_KS).toBeCloseTo(246.1, 1);
    expect(orderRecipeData.slurryTotalGToU_KS).toBeCloseTo(283.96, 2);

    expect(orderRecipeData.slurryTotalMlTo100Kg).toBeCloseTo(2604.3, 1);
    expect(orderRecipeData.slurryTotalGTo100Kgs).toBeCloseTo(3004.86, 2);
    expect(orderRecipeData.productRecipes.length).toBe(order.productDetails.length);
  });

  // Add more test cases as needed
});