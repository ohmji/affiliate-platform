import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1716403200000 implements MigrationInterface {
  name = 'InitSchema1716403200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "products" (
        "id" uuid PRIMARY KEY,
        "title" text,
        "image_url" text,
        "source" text NOT NULL DEFAULT 'admin',
        "normalized_sku" text,
        "normalized_url" text,
        "raw_input" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "campaigns" (
        "id" uuid PRIMARY KEY,
        "name" text NOT NULL,
        "utm_campaign" text,
        "start_at" timestamptz,
        "end_at" timestamptz,
        "status" text NOT NULL DEFAULT 'draft',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "offers" (
        "id" uuid PRIMARY KEY,
        "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "marketplace" text NOT NULL,
        "store_name" text NOT NULL,
        "price" numeric NOT NULL,
        "currency" text NOT NULL DEFAULT 'THB',
        "last_checked_at" timestamptz NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_offers_product_marketplace" ON "offers" ("product_id", "marketplace")'
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "links" (
        "id" uuid PRIMARY KEY,
        "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "campaign_id" uuid REFERENCES "campaigns"("id") ON DELETE SET NULL,
        "short_code" text NOT NULL,
        "marketplace" text NOT NULL,
        "target_url" text NOT NULL,
        "utm_source" text,
        "utm_medium" text,
        "utm_campaign" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_links_short_code" UNIQUE ("short_code")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "clicks" (
        "id" bigserial PRIMARY KEY,
        "link_id" uuid NOT NULL REFERENCES "links"("id") ON DELETE CASCADE,
        "occurred_at" timestamptz NOT NULL DEFAULT now(),
        "referrer" text,
        "user_agent" text,
        "ip_hash" text,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_clicks_link_occurred" ON "clicks" ("link_id", "occurred_at")'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_clicks_link_occurred"');
    await queryRunner.query('DROP TABLE IF EXISTS "clicks"');
    await queryRunner.query('DROP TABLE IF EXISTS "links"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_offers_product_marketplace"');
    await queryRunner.query('DROP TABLE IF EXISTS "offers"');
    await queryRunner.query('DROP TABLE IF EXISTS "campaigns"');
    await queryRunner.query('DROP TABLE IF EXISTS "products"');
  }
}
