import { MigrationInterface, QueryRunner } from "typeorm";

export class Auto1732369172924 implements MigrationInterface {
    name = 'Auto1732369172924'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "product_detail" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "quantity" double precision NOT NULL, "rateUnit" character varying NOT NULL, "rateType" character varying NOT NULL, "density" double precision NOT NULL, "rate" double precision NOT NULL, "orderId" uuid, CONSTRAINT "PK_12ea67a439667df5593ff68fc33" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "order" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "lotNumber" character varying NOT NULL, "status" character varying NOT NULL, "recipeDate" character varying NOT NULL, "applicationDate" character varying NOT NULL, "operator" character varying NOT NULL, "crop" character varying NOT NULL, "variety" character varying NOT NULL, "tkw" double precision NOT NULL, "quantity" double precision NOT NULL, "packaging" character varying NOT NULL, "bagSize" double precision NOT NULL, CONSTRAINT "PK_1031171c13130102495201e3e20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "product_detail" ADD CONSTRAINT "FK_b9bf5400543060244cb97a87183" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_detail" DROP CONSTRAINT "FK_b9bf5400543060244cb97a87183"`);
        await queryRunner.query(`DROP TABLE "order"`);
        await queryRunner.query(`DROP TABLE "product_detail"`);
        await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
    }

}
