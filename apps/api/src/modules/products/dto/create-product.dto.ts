import { IsIn, IsOptional, IsString } from 'class-validator';

const SUPPORTED_MARKETPLACES = ['lazada', 'shopee'] as const;
type Marketplace = (typeof SUPPORTED_MARKETPLACES)[number];

export class CreateProductDto {
  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsIn(SUPPORTED_MARKETPLACES)
  marketplace?: Marketplace;

  @IsOptional()
  @IsString()
  source?: 'admin';
}
