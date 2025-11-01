import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUuidDefaults1716403300001 implements MigrationInterface {
  name = 'AddUuidDefaults1716403300001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    await queryRunner.query(
      'ALTER TABLE "products" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()'
    );
    await queryRunner.query(
      'ALTER TABLE "offers" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()'
    );
    await queryRunner.query(
      'ALTER TABLE "campaigns" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()'
    );
    await queryRunner.query(
      'ALTER TABLE "links" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "links" ALTER COLUMN "id" DROP DEFAULT');
    await queryRunner.query('ALTER TABLE "campaigns" ALTER COLUMN "id" DROP DEFAULT');
    await queryRunner.query('ALTER TABLE "offers" ALTER COLUMN "id" DROP DEFAULT');
    await queryRunner.query('ALTER TABLE "products" ALTER COLUMN "id" DROP DEFAULT');
  }
}
