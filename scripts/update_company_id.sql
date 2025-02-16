-- Add companyId column to Crop table
ALTER TABLE "crop"
ADD COLUMN "companyId" uuid;

-- Update Crop entities
UPDATE "crop"
SET "companyId" = '8eb83b3c-f744-4df3-bf07-371eb58a1528';

-- Add companyId column to Operator table
ALTER TABLE "operator"
ADD COLUMN "companyId" uuid;

-- Update Operator entities
UPDATE "operator"
SET "companyId" = '8eb83b3c-f744-4df3-bf07-371eb58a1528';

-- Add companyId column to Product table
ALTER TABLE "product"
ADD COLUMN "companyId" uuid;

-- Update Product entities
UPDATE "product"
SET "companyId" = '8eb83b3c-f744-4df3-bf07-371eb58a1528';

-- Add companyId column to Variety table
ALTER TABLE "variety"
ADD COLUMN "companyId" uuid;

-- Update Variety entities
UPDATE "variety"
SET "companyId" = '8eb83b3c-f744-4df3-bf07-371eb58a1528';

-- Add companyId column to Order table
ALTER TABLE "order"
ADD COLUMN "companyId" uuid;

-- Update Order entities
UPDATE "order"
SET "companyId" = '8eb83b3c-f744-4df3-bf07-371eb58a1528';
