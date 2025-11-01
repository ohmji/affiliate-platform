import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Matches
} from 'class-validator';

export class UpsertCampaignDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  name!: string;

  @IsOptional()
  @Matches(/^[a-zA-Z0-9\-_]+$/, {
    message: 'utmCampaign may only contain alphanumeric, dash or underscore characters'
  })
  utmCampaign?: string;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @Matches(/^(draft|published)$/)
  status?: 'draft' | 'published';
}
