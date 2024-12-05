import { createOrderRecipe } from './calculator';
import { RateType, RateUnit } from '../models/ProductDetail';
import { Order, OrderStatus } from '../models/Order';
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

describe('createOrderRecipe', () => {
  it('should create an order recipe data correctly', () => {
    const order: Order = {
      id: 'order1',
      bagSize: 50,
      tkw: 40,
      quantity: 1000,
      extraSlurry: 10,
      productDetails: [
        {
          quantity: 100,
          rateUnit: RateUnit.ML,
          rateType: RateType.Unit,
          product: {
            id: 'product1',
            name: 'Product 1',
            density: 1.2,
            activeIngredient: 'Ingredient 1',
            // Mock other necessary properties for Product
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Product,
          id: 'productDetail1',
          order: {} as Order,
          density: 1.2,
          rate: 100,
          index: 0,
        },
        // Add more product details as needed
      ],
      lotNumber: 'lot1',
      status: OrderStatus.NotStarted,
      recipeDate: new Date().toISOString(),
      applicationDate: new Date().toISOString(),
      packaging: 'packaging1',
      operator: new Operator(),
      crop: new Crop(),
      variety: new Variety(),
      orderExecution: new OrderExecution(),
      orderRecipe: new OrderRecipe(),
    };

    const orderRecipeData = createOrderRecipe(order);

    expect(orderRecipeData).toBeDefined();
    expect(orderRecipeData.order.id).toBe(order.id);
    expect(orderRecipeData.totalCompoundsDensity).toBeGreaterThan(0);
    expect(orderRecipeData.slurryTotalMltoU_KS).toBeGreaterThan(0);
    expect(orderRecipeData.productRecipes.length).toBe(order.productDetails.length);
  });

  // Add more test cases as needed
});