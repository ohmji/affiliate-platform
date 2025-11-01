import {
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID
} from 'class-validator';

const MARKETPLACES = ['lazada', 'shopee'] as const;

export class CreateLinkDto {
  @IsUUID()
  productId!: string;

  @IsOptional()
  @IsUUID()
  campaignId?: string | null;

  @IsIn(MARKETPLACES)
  marketplace!: (typeof MARKETPLACES)[number];

  @IsUrl({ require_tld: false })
  targetUrl!: string;

  @IsOptional()
  @IsString()
  utmSource?: string;

  @IsOptional()
  @IsString()
  utmMedium?: string;

  @IsOptional()
  @IsString()
  utmCampaign?: string;
}
